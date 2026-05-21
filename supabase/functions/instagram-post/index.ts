// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

let _wasmReady: Promise<void> | null = null;
async function ensureWasm() {
  if (!_wasmReady) {
    _wasmReady = (async () => {
      const wasm = await fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
      await initWasm(await wasm.arrayBuffer());
    })();
  }
  return _wasmReady;
}

let _fonts: Uint8Array[] | null = null;
async function loadFonts(): Promise<Uint8Array[]> {
  if (_fonts) return _fonts;
  const urls = [
    "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf",
    "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf",
  ];
  const bufs = await Promise.all(
    urls.map(async (u) => {
      const r = await fetch(u);
      if (!r.ok) throw new Error(`Font fetch ${u} failed: ${r.status}`);
      return new Uint8Array(await r.arrayBuffer());
    }),
  );
  _fonts = bufs;
  return bufs;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IG_ID = Deno.env.get("META_IG_ACCOUNT_ID") ?? "17841442278138192";
const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

type PostType = "story" | "reel" | "feed";
type Slide = { headline: string[]; subtext: string };

const SYSTEM_PROMPT =
  "Du bist ein professioneller Social Media Manager für KSE Group, eine Marketing & New Media Agentur. Erstelle professionellen, corporate Content auf Deutsch. Antworte NUR mit einem JSON-Objekt.";

function userPrompt(type: PostType) {
  if (type === "story" || type === "reel") {
    return `Erstelle einen ${type} (einzelnes Bild) für @kse.group. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 2-3 Hashtags", "headline": ["LINE ONE.", "LINE TWO."], "subtext": "Zeile eins\\nZeile zwei"}. Headline: max 2 Zeilen, MAX 15 Zeichen pro Zeile, GROSSBUCHSTABEN, mit Punkt am Ende. Subtext: 2 kurze Zeilen.`;
  }
  return `Erstelle einen Instagram-Karussell-Post mit GENAU 7 Slides für @kse.group (erlaubt sind 5-9, wähle 7). Jede Slide hat max. 2 kurze Headline-Zeilen (MAX 15 Zeichen pro Zeile, GROSSBUCHSTABEN, mit Punkt am Ende) und 2 Zeilen Subtext. Slide 1 ist der Hook/Titel, Slides 2-6 liefern Mehrwert/Insights, die letzte Slide ist immer ein Call-to-Action. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 3 Hashtags", "slides": [{"headline": ["LINE ONE.", "LINE TWO."], "subtext": "Zeile eins\\nZeile zwei"}, ... insgesamt 7 Einträge ...]}`;
}

async function generateContent(
  type: PostType,
): Promise<{ caption: string; slides?: Slide[]; headline?: string[]; subtext?: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
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
  if (type === "story" || type === "reel") {
    if (!Array.isArray(parsed.headline) || !parsed.subtext) {
      throw new Error("Missing headline/subtext");
    }
  }
  if (type === "feed") {
    if (!Array.isArray(parsed.slides) || parsed.slides.length < 5 || parsed.slides.length > 9) {
      throw new Error(`Expected 5-9 slides, got ${Array.isArray(parsed.slides) ? parsed.slides.length : "none"}`);
    }
  }
  return parsed;
}

async function generateImage(
  headline: string[],
  subtext: string,
  slideNum: string | null,
  height = 1080,
): Promise<Uint8Array> {
  await ensureWasm();

  const width = 1080;
  const headlineY = Math.round(height / 2) - 70;
  const headlineLineH = 95;
  const subY = headlineY + headline.length * headlineLineH + 40;
  const subLines = subtext.split("\n");

  const headlineTspans = headline
    .map(
      (line, i) =>
        `<tspan x="80" y="${headlineY + i * headlineLineH}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const subTspans = subLines
    .map(
      (line, i) =>
        `<tspan x="80" y="${subY + i * 46}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const numText = slideNum
    ? `<text x="900" y="75" fill="#2E2E2E" font-family="Roboto" font-size="24">${escapeXml(slideNum)}</text>`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#080808"/>
  <rect x="0" y="0" width="${width}" height="5" fill="#1A1A1A"/>
  <rect x="0" y="${height - 50}" width="${width}" height="50" fill="#111111"/>
  ${numText}
  <rect x="80" y="${headlineY - 110}" width="80" height="8" fill="#FFFFFF"/>
  <text fill="#FFFFFF" font-family="Roboto" font-size="82" font-weight="bold">${headlineTspans}</text>
  <text fill="#666666" font-family="Roboto" font-size="34">${subTspans}</text>
  <text x="80" y="${height - 17}" fill="#333333" font-family="Roboto" font-size="26">kse.group  ·  Marketing &amp; New Media Agentur</text>
</svg>`;

  const fontBuffers = await loadFonts();
  const resvg = new Resvg(svg, {
    font: {
      loadSystemFonts: false,
      fontBuffers,
      defaultFontFamily: "Roboto",
    },
  });
  return resvg.render().asPng();
}

async function uploadImage(
  supabase: any,
  png: Uint8Array,
  filename: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from("instagram")
    .upload(filename, png, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return `${SUPABASE_URL}/storage/v1/object/public/instagram/${filename}`;
}

async function postCarouselToInstagram(
  caption: string,
  imageUrls: string[],
): Promise<string> {
  // Step 1: create child containers (one per image), with 3s pacing
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const p = new URLSearchParams({
      image_url: url,
      is_carousel_item: "true",
      access_token: META_TOKEN,
    });
    const r = await fetch(`${GRAPH}/${IG_ID}/media`, { method: "POST", body: p });
    const d = await r.json();
    if (!r.ok || !d.id) throw new Error(`Child container failed: ${JSON.stringify(d)}`);
    childIds.push(d.id);
    await new Promise((res) => setTimeout(res, 3000));
  }

  // Step 2: create carousel container
  const carouselParams = new URLSearchParams({
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
    access_token: META_TOKEN,
  });
  const cRes = await fetch(`${GRAPH}/${IG_ID}/media`, {
    method: "POST",
    body: carouselParams,
  });
  const cData = await cRes.json();
  if (!cRes.ok || !cData.id) {
    throw new Error(`Carousel container failed: ${JSON.stringify(cData)}`);
  }

  // Step 3: wait then publish
  await new Promise((res) => setTimeout(res, 5000));
  const pubParams = new URLSearchParams({
    creation_id: cData.id,
    access_token: META_TOKEN,
  });
  const pRes = await fetch(`${GRAPH}/${IG_ID}/media_publish`, {
    method: "POST",
    body: pubParams,
  });
  const pData = await pRes.json();
  if (!pRes.ok || !pData.id) {
    throw new Error(`Carousel publish failed: ${JSON.stringify(pData)}`);
  }
  return pData.id as string;
}

async function postToInstagram(
  type: PostType,
  caption: string,
  media: { image_url: string },
): Promise<string> {
  // Step 1: create media container
  const createParams = new URLSearchParams({ access_token: META_TOKEN });
  if (type === "story") {
    createParams.set("media_type", "STORIES");
    createParams.set("image_url", media.image_url);
  } else if (type === "reel") {
    // Satori = images only; post reel-equivalent as a single feed image
    createParams.set("image_url", media.image_url);
    createParams.set("caption", caption);
  } else {
    createParams.set("image_url", media.image_url);
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

  // Step 2: brief wait for container processing
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

async function runJob(
  jobId: string,
  type: PostType,
  supabase: any,
  overrideSlides?: Slide[],
  overrideCaption?: string,
): Promise<void> {
  let caption = "";
  let slidesMeta = "";
  let image_url = "";
  try {
    if (type === "story" || type === "reel") {
      const gen = await generateContent(type);
      caption = gen.caption;
      const headline = gen.headline!;
      const subtext = gen.subtext!;
      const height = 1920; // story/reel format
      const png = await generateImage(headline, subtext, null, height);
      image_url = await uploadImage(supabase, png, `${type}_${Date.now()}.png`);
      let ig_media_id: string;
      try {
        ig_media_id = await postToInstagram(type, caption, { image_url });
      } catch (e) {
        console.warn("First attempt failed, retrying in 60s:", (e as Error).message);
        await new Promise((r) => setTimeout(r, 60_000));
        ig_media_id = await postToInstagram(type, caption, { image_url });
      }
      await supabase
        .from("posts_log")
        .update({
          caption,
          image_url,
          image_prompt: JSON.stringify({ headline, subtext }),
          video_url: null,
          ig_media_id,
          status: "success",
        })
        .eq("id", jobId);
    } else {
      // FEED = carousel of 5 generated slides
      let slides: Slide[];
      if (overrideSlides && overrideCaption) {
        slides = overrideSlides;
        caption = overrideCaption;
      } else {
        const gen = await generateContent(type);
        caption = gen.caption;
        slides = gen.slides!;
      }
      slidesMeta = JSON.stringify(slides);

      const ts = Date.now();
      const urls: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const num = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
        const png = await generateImage(s.headline, s.subtext, num, 1080);
        const url = await uploadImage(supabase, png, `slide_${ts}_${i + 1}.png`);
        urls.push(url);
      }
      image_url = urls[0];
      const ig_media_id = await postCarouselToInstagram(caption, urls);
      await supabase
        .from("posts_log")
        .update({
          caption,
          image_url,
          image_prompt: slidesMeta,
          video_url: null,
          ig_media_id,
          status: "success",
        })
        .eq("id", jobId);
    }
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error("Job failed", jobId, msg);
    await supabase
      .from("posts_log")
      .update({
        caption: caption || null,
        image_url: image_url || null,
        image_prompt: slidesMeta || null,
        video_url: null,
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

  let body: {
    type?: PostType;
    triggered_by?: "cron" | "manual";
    force?: boolean;
    action?: "one_time_demo";
  } = {};
  try {
    body = await req.json();
  } catch (_) {
    /* allow empty */
  }

  // One-time demo carousel using fixed slides
  if (body.action === "one_time_demo") {
    const slides: Slide[] = [
      { headline: ["DEINE MARKE.", "UNSERE MISSION."], subtext: "KSE Group transformiert Unternehmen\nin der digitalen Welt." },
      { headline: ["KI-MARKETING", "IST JETZT."], subtext: "Automatisierung trifft Kreativität.\nDein Wettbewerb schläft noch." },
      { headline: ["CONTENT.", "SKALIERT TÄGLICH."], subtext: "Wir produzieren Content der verkauft –\nautomatisch, konsistent, professionell." },
      { headline: ["NEW MEDIA.", "NEUE REGELN."], subtext: "Die Gewinner von morgen nutzen\ndie Tools von heute." },
      { headline: ["BEREIT FÜR", "DIE ZUKUNFT?"], subtext: "Lass uns reden.\nkse.group" },
    ];
    const caption =
      "Innovative Strategien für digitale Exzellenz. Wir transformieren Ihre Marke in der digitalen Welt. 🚀 #DigitalMarketing #NewMedia #KSEGroup";

    const { data: job, error: insertErr } = await supabase
      .from("posts_log")
      .insert({ type: "feed", status: "pending", triggered_by: "manual" })
      .select("id")
      .single();
    if (insertErr || !job) {
      return new Response(JSON.stringify({ ok: false, error: insertErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    // @ts-ignore
    EdgeRuntime.waitUntil(runJob(job.id, "feed", supabase, slides, caption));
    return new Response(JSON.stringify({ ok: true, jobId: job.id, status: "pending" }), {
      status: 202,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
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