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
const HEYGEN_API_KEY = Deno.env.get("HEYGEN_API_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";

type PostType = "story" | "reel" | "feed";

const SYSTEM_PROMPT =
  "Du bist ein professioneller Social Media Manager für KSE Group, eine Marketing & New Media Agentur. Erstelle professionellen, corporate Content auf Deutsch. Antworte NUR mit einem JSON-Objekt.";

function userPrompt(type: PostType) {
  if (type === "story" || type === "reel") {
    return `Erstelle einen ${type} für @kse.group. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 2-3 Hashtags", "video_script": "Kurzes 15-20 Sekunden Video Script für KSE Group. Professionell, corporate, auf Deutsch. Zeigt Marketing-Expertise. Kein Avatar, nur Text-Animationen und visuelle Effekte im Film Noir Stil."}`;
  }
  return `Erstelle einen ${type} für @kse.group. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 2-3 Hashtags", "image_prompt": "English prompt for abstract corporate marketing visual, no text, no people"}`;
}

async function generateContent(
  type: PostType,
): Promise<{ caption: string; image_prompt?: string; video_script?: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
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
  if (!parsed.caption) throw new Error("Missing caption");
  if ((type === "story" || type === "reel") && !parsed.video_script) {
    throw new Error("Missing video_script");
  }
  if (type === "feed" && !parsed.image_prompt) {
    throw new Error("Missing image_prompt");
  }
  return parsed;
}

function imageUrl(prompt: string) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true`;
}

async function generateHeyGenVideo(script: string): Promise<string> {
  // Step 1: kick off generation via the real Video Agent endpoint
  const genResp = await fetch("https://api.heygen.com/v1/video_agent/generate", {
    method: "POST",
    headers: { "X-Api-Key": HEYGEN_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: script,
      config: { orientation: "portrait", duration_sec: 20 },
    }),
  });
  if (!genResp.ok) {
    throw new Error(`HeyGen generate failed: ${genResp.status} ${await genResp.text()}`);
  }
  const genData = await genResp.json();
  const video_id = genData?.data?.video_id ?? genData?.video_id;
  if (!video_id) {
    throw new Error(`HeyGen generate: no video_id (${JSON.stringify(genData)})`);
  }

  // Step 2: poll standard video_status endpoint (every 15s, max 10 minutes)
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 15_000));
    const statusResp = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(video_id)}`,
      { headers: { "X-Api-Key": HEYGEN_API_KEY } },
    );
    if (!statusResp.ok) continue;
    const statusData = await statusResp.json();
    const status = statusData?.data?.status ?? statusData?.status;
    if (status === "completed") {
      const video_url = statusData?.data?.video_url ?? statusData?.video_url;
      if (!video_url) {
        throw new Error(`HeyGen completed but no video_url: ${JSON.stringify(statusData)}`);
      }
      return video_url;
    }
    if (status === "failed") {
      throw new Error(`HeyGen video failed: ${JSON.stringify(statusData)}`);
    }
  }
  throw new Error("HeyGen timeout after 10 minutes");
}

async function postToInstagram(
  type: PostType,
  caption: string,
  media: { image_url?: string; video_url?: string },
): Promise<string> {
  // Step 1: create media container
  const createParams = new URLSearchParams({ access_token: META_TOKEN });
  if (type === "story") {
    createParams.set("media_type", "STORIES");
    if (media.video_url) createParams.set("video_url", media.video_url);
    else if (media.image_url) createParams.set("image_url", media.image_url);
  } else if (type === "reel") {
    createParams.set("media_type", "REELS");
    createParams.set("video_url", media.video_url!);
    createParams.set("caption", caption);
  } else {
    createParams.set("image_url", media.image_url!);
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

  // Step 2: wait for container processing (videos take longer)
  const isVideo = !!media.video_url;
  if (isVideo) {
    // poll status for up to ~2 minutes
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(
        `${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(META_TOKEN)}`,
      );
      const statusData = await statusRes.json();
      if (statusData.status_code === "FINISHED") break;
      if (statusData.status_code === "ERROR") {
        throw new Error(`Meta container error: ${JSON.stringify(statusData)}`);
      }
    }
  } else {
    await new Promise((r) => setTimeout(r, 3000));
  }

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

async function runJob(
  jobId: string,
  type: PostType,
  supabase: any,
): Promise<void> {
  let caption = "";
  let image_prompt = "";
  let image_url = "";
  let video_url = "";
  let video_script = "";
  try {
    const gen = await generateContent(type);
    caption = gen.caption;

    if (type === "story" || type === "reel") {
      video_script = gen.video_script!;
      video_url = await generateHeyGenVideo(video_script);
    } else {
      image_prompt = gen.image_prompt!;
      image_url = imageUrl(image_prompt);
    }

    const media = video_url ? { video_url } : { image_url };

    let ig_media_id: string;
    try {
      ig_media_id = await postToInstagram(type, caption, media);
    } catch (e) {
      console.warn("First attempt failed, retrying in 60s:", (e as Error).message);
      await new Promise((r) => setTimeout(r, 60_000));
      ig_media_id = await postToInstagram(type, caption, media);
    }

    await supabase
      .from("posts_log")
      .update({
        caption,
        image_url: image_url || null,
        image_prompt: image_prompt || video_script || null,
        video_url: video_url || null,
        ig_media_id,
        status: "success",
      })
      .eq("id", jobId);
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error("Job failed", jobId, msg);
    await supabase
      .from("posts_log")
      .update({
        caption: caption || null,
        image_url: image_url || null,
        image_prompt: image_prompt || video_script || null,
        video_url: video_url || null,
        status: "failed",
        error_message: msg,
      })
      .eq("id", jobId);
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

  // Create pending job row immediately so the UI shows status right away
  const { data: job, error: insertErr } = await supabase
    .from("posts_log")
    .insert({
      type,
      status: "pending",
      triggered_by: triggeredBy,
    })
    .select("id")
    .single();

  if (insertErr || !job) {
    return new Response(JSON.stringify({ ok: false, error: insertErr?.message ?? "insert failed" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Run in background — function returns immediately, work continues after response
  // @ts-ignore EdgeRuntime is provided by Supabase Edge runtime
  EdgeRuntime.waitUntil(runJob(job.id, type, supabase));

  return new Response(JSON.stringify({ ok: true, jobId: job.id, status: "pending" }), {
    status: 202,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});