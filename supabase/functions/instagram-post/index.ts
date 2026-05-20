// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IG_ID = Deno.env.get("META_IG_ACCOUNT_ID") ?? "17841442278138192";
const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";

type PostType = "story" | "reel" | "feed";

const SYSTEM_PROMPT =
  "Du bist ein professioneller Social Media Manager für KSE Group, eine Marketing & New Media Agentur. Erstelle professionellen, corporate Content auf Deutsch. Antworte NUR mit einem JSON-Objekt.";

function userPrompt(type: PostType) {
  return `Erstelle einen ${type} für @kse.group. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 2-3 Hashtags", "image_prompt": "English prompt for abstract corporate marketing visual, no text, no people"}`;
}

async function generateContent(type: PostType): Promise<{ caption: string; image_prompt: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(type) }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in Claude response: ${text.slice(0, 200)}`);
  const parsed = JSON.parse(match[0]);
  if (!parsed.caption || !parsed.image_prompt) throw new Error("Missing caption/image_prompt");
  return parsed;
}

function imageUrl(prompt: string) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true`;
}

async function postToInstagram(
  type: PostType,
  caption: string,
  image_url: string,
): Promise<string> {
  // Step 1: create media container
  const createParams = new URLSearchParams({ access_token: META_TOKEN, image_url });
  if (type === "story" || type === "reel") {
    createParams.set("media_type", "STORIES");
  } else {
    createParams.set("caption", caption);
  }
  const createRes = await fetch(`${GRAPH}/${IG_ID}/media`, {
    method: "POST",
    body: createParams,
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    throw new Error(`Meta create container failed: ${JSON.stringify(createData)}`);
  }
  const creationId = createData.id;

  // Step 2: small wait for container processing (stories esp.)
  await new Promise((r) => setTimeout(r, 3000));

  // Step 3: publish
  const pubParams = new URLSearchParams({ access_token: META_TOKEN, creation_id: creationId });
  const pubRes = await fetch(`${GRAPH}/${IG_ID}/media_publish`, {
    method: "POST",
    body: pubParams,
  });
  const pubData = await pubRes.json();
  if (!pubRes.ok || !pubData.id) {
    throw new Error(`Meta publish failed: ${JSON.stringify(pubData)}`);
  }
  return pubData.id as string;
}

async function runOnce(
  type: PostType,
  supabase: any,
  triggeredBy: "cron" | "manual",
): Promise<{ ok: boolean; ig_media_id?: string; error?: string }> {
  let caption = "";
  let image_prompt = "";
  let image_url = "";
  try {
    const gen = await generateContent(type);
    caption = gen.caption;
    image_prompt = gen.image_prompt;
    image_url = imageUrl(image_prompt);

    let ig_media_id: string;
    try {
      ig_media_id = await postToInstagram(type, caption, image_url);
    } catch (e) {
      // retry once after 60s
      console.warn("First attempt failed, retrying in 60s:", (e as Error).message);
      await new Promise((r) => setTimeout(r, 60_000));
      ig_media_id = await postToInstagram(type, caption, image_url);
    }

    await supabase.from("posts_log").insert({
      type,
      caption,
      image_url,
      image_prompt,
      ig_media_id,
      status: "success",
      triggered_by: triggeredBy,
    });
    return { ok: true, ig_media_id };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    await supabase.from("posts_log").insert({
      type,
      caption: caption || null,
      image_url: image_url || null,
      image_prompt: image_prompt || null,
      status: "failed",
      error_message: msg,
      triggered_by: triggeredBy,
    });
    return { ok: false, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { type?: PostType; triggered_by?: "cron" | "manual"; force?: boolean } = {};
  try {
    body = await req.json();
  } catch (_) {
    /* allow empty */
  }

  const type = body.type;
  const triggeredBy = body.triggered_by ?? "manual";
  if (!type || !["story", "reel", "feed"].includes(type)) {
    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // For cron: respect the enable flag in automation_config
  if (triggeredBy === "cron" && !body.force) {
    const { data: cfg } = await supabase
      .from("automation_config")
      .select("value")
      .eq("key", `${type}_enabled`)
      .maybeSingle();
    if (!cfg || cfg.value !== true) {
      return new Response(
        JSON.stringify({ skipped: true, reason: `${type}_enabled is false` }),
        { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // For feed: enforce min 2 day gap
    if (type === "feed") {
      const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("posts_log")
        .select("id")
        .eq("type", "feed")
        .eq("status", "success")
        .gt("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "last feed post < 2 days ago" }),
          { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } },
        );
      }
    }
  }

  const result = await runOnce(type, supabase, triggeredBy);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 500,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});