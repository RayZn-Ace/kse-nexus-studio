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
const CREATOMATE_KEY = Deno.env.get("CREATOMATE_API_KEY")!;
const PIXABAY_KEY = Deno.env.get("PIXABAY_API_KEY")!;

type PostType = "story" | "reel" | "feed";
type Slide = { headline: string[]; subtext: string };
type SlideVisualOptions = { layoutIndex?: number; width?: number };

const SYSTEM_PROMPT =
  "Du bist ein professioneller Social Media Manager für KSE Group, eine Marketing & New Media Agentur. Erstelle professionellen, corporate Content auf Deutsch. Antworte NUR mit einem JSON-Objekt.";

function userPrompt(type: PostType) {
  if (type === "story") {
    return `Erstelle einen ${type} (einzelnes Bild) für @kse.group. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 2-3 Hashtags", "headline": ["LINE ONE.", "LINE TWO."], "subtext": "Zeile eins\\nZeile zwei"}. Headline: max 2 Zeilen, MAX 15 Zeichen pro Zeile, GROSSBUCHSTABEN, mit Punkt am Ende. Subtext: 2 kurze Zeilen.`;
  }
  if (type === "reel") {
    return `Erstelle ein Instagram-Reel (Diashow mit Musik) für @kse.group mit GENAU 7 Slides (erlaubt 5-9). Jede Slide: 1-2 kurze Headline-Zeilen (MAX 15 Zeichen pro Zeile, GROSSBUCHSTABEN, mit Punkt am Ende) und 2 kurze Subtext-Zeilen. Slide 1 ist ein starker Hook, Slides 2-6 liefern Wert/Insights, letzte Slide ist Call-to-Action. Schlage außerdem 2-3 englische Such-Keywords für royalty-free Hintergrundmusik vor, die zum Vibe passt (z.B. "corporate uplifting", "modern tech", "cinematic motivational"). Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 3 Hashtags", "music_keywords": "corporate uplifting", "slides": [{"headline": ["LINE ONE.", "LINE TWO."], "subtext": "Zeile eins\\nZeile zwei"}, ... insgesamt 7 ...]}`;
  }
  return `Erstelle einen Instagram-Karussell-Post mit GENAU 7 Slides für @kse.group (erlaubt sind 5-9, wähle 7). Jede Slide hat max. 2 kurze Headline-Zeilen (MAX 15 Zeichen pro Zeile, GROSSBUCHSTABEN, mit Punkt am Ende) und 2 Zeilen Subtext. Slide 1 ist der Hook/Titel, Slides 2-6 liefern Mehrwert/Insights, die letzte Slide ist immer ein Call-to-Action. Gib NUR JSON zurück: {"caption": "max 150 Zeichen, professionell, 3 Hashtags", "slides": [{"headline": ["LINE ONE.", "LINE TWO."], "subtext": "Zeile eins\\nZeile zwei"}, ... insgesamt 7 Einträge ...]}`;
}

async function generateContent(
  type: PostType,
): Promise<{ caption: string; slides?: Slide[]; headline?: string[]; subtext?: string; music_keywords?: string }> {
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
  if (type === "story") {
    if (!Array.isArray(parsed.headline) || !parsed.subtext) {
      throw new Error("Missing headline/subtext");
    }
  }
  if (type === "reel" || type === "feed") {
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
  options: SlideVisualOptions = {},
): Promise<Uint8Array> {
  await ensureWasm();

  const width = options.width ?? 1080;
  const scale = width / 1080;
  const layoutIndex = options.layoutIndex ?? 0;
  const layout = layoutIndex % 5;
  const headlineSize = Math.round((height > width ? 122 : 88) * scale);
  const headlineLineH = Math.round(headlineSize * 1.08);
  const subSize = Math.round((height > width ? 54 : 38) * scale);
  const subLineH = Math.round(subSize * 1.32);
  const pad = Math.round(82 * scale);
  const headlineY = Math.round(height * (layout === 1 ? 0.32 : layout === 2 ? 0.47 : layout === 3 ? 0.25 : layout === 4 ? 0.58 : 0.42));
  const subY = headlineY + headline.length * headlineLineH + Math.round(48 * scale);
  const subLines = subtext.split("\n");
  const accent = ["#E8FF00", "#FFFFFF", "#33D6FF", "#FF4D4D", "#B8FF5C"][layout];
  const muted = layout === 1 || layout === 3 ? "#D7D7D7" : "#F0F0F0";
  const bg = layout === 3 ? "#F1F1EA" : "#050505";
  const fg = layout === 3 ? "#050505" : "#FFFFFF";
  const footer = layout === 3 ? "#202020" : "#CFCFCF";
  const textX = layout === 1 || layout === 4 ? Math.round(width / 2) : pad;
  const textAnchor = layout === 1 || layout === 4 ? "middle" : "start";

  const headlineTspans = headline
    .map(
      (line, i) =>
        `<tspan x="${textX}" y="${headlineY + i * headlineLineH}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const subTspans = subLines
    .map(
      (line, i) =>
        `<tspan x="${textX}" y="${subY + i * subLineH}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const numText = slideNum
    ? `<text x="${width - pad}" y="${Math.round(82 * scale)}" text-anchor="end" fill="${footer}" font-family="Roboto" font-size="${Math.round(32 * scale)}" font-weight="bold">${escapeXml(slideNum)}</text>`
    : "";

  const decor = [
    `<rect x="0" y="0" width="${Math.round(26 * scale)}" height="${height}" fill="${accent}"/>
     <rect x="${pad}" y="${headlineY - Math.round(150 * scale)}" width="${Math.round(150 * scale)}" height="${Math.round(12 * scale)}" fill="${accent}"/>`,
    `<circle cx="${Math.round(width / 2)}" cy="${Math.round(height * 0.21)}" r="${Math.round(150 * scale)}" fill="none" stroke="${accent}" stroke-width="${Math.round(14 * scale)}"/>
     <text x="${Math.round(width / 2)}" y="${Math.round(height * 0.225)}" text-anchor="middle" fill="${accent}" font-family="Roboto" font-size="${Math.round(70 * scale)}" font-weight="bold">${escapeXml(slideNum?.split(" / ")[0] ?? "")}</text>`,
    `<rect x="${Math.round(width * 0.58)}" y="0" width="${Math.round(width * 0.42)}" height="${height}" fill="#111111"/>
     <rect x="${pad}" y="${Math.round(height * 0.18)}" width="${Math.round(14 * scale)}" height="${Math.round(height * 0.64)}" fill="${accent}"/>`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#F1F1EA"/>
     <rect x="${pad}" y="${pad}" width="${width - pad * 2}" height="${height - pad * 2}" fill="none" stroke="#050505" stroke-width="${Math.round(8 * scale)}"/>
     <rect x="${pad}" y="${pad}" width="${Math.round(width * 0.32)}" height="${Math.round(28 * scale)}" fill="#050505"/>`,
    `<rect x="0" y="${Math.round(height * 0.63)}" width="${width}" height="${Math.round(height * 0.37)}" fill="#111111"/>
     <rect x="${Math.round(width * 0.13)}" y="${Math.round(height * 0.12)}" width="${Math.round(width * 0.74)}" height="${Math.round(18 * scale)}" fill="${accent}"/>`,
  ][layout];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  ${decor}
  ${numText}
  <text fill="${fg}" text-anchor="${textAnchor}" font-family="Roboto" font-size="${headlineSize}" font-weight="bold">${headlineTspans}</text>
  <text fill="${muted}" text-anchor="${textAnchor}" font-family="Roboto" font-size="${subSize}" font-weight="bold">${subTspans}</text>
  <text x="${pad}" y="${height - Math.round(54 * scale)}" fill="${footer}" font-family="Roboto" font-size="${Math.round(34 * scale)}" font-weight="bold">kse.group  ·  Marketing &amp; New Media</text>
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

async function uploadBytes(
  supabase: any,
  bytes: Uint8Array,
  filename: string,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from("instagram")
    .upload(filename, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload (${contentType}) failed: ${error.message}`);
  return `${SUPABASE_URL}/storage/v1/object/public/instagram/${filename}`;
}

// Curated royalty-free tracks from Incompetech (Kevin MacLeod, CC-BY 4.0).
// Direct hotlinking allowed; no API key required.
const MUSIC_LIBRARY: Record<string, string[]> = {
  corporate: [
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3",
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wallpaper.mp3",
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hep%20Cats.mp3",
  ],
  uplifting: [
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Inspired.mp3",
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cool%20Vibes.mp3",
  ],
  cinematic: [
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heroic%20Age.mp3",
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lightless%20Dawn.mp3",
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3",
  ],
  tech: [
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Electrodoodle.mp3",
    "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3",
  ],
};

function pickMusicUrl(keywords: string): string {
  const k = (keywords || "corporate uplifting").toLowerCase();
  let pool: string[] = [];
  if (/cinema|epic|dramatic|film/.test(k)) pool = pool.concat(MUSIC_LIBRARY.cinematic);
  if (/tech|future|digital|electronic|edm|house/.test(k)) pool = pool.concat(MUSIC_LIBRARY.tech);
  if (/uplift|energ|power|motivat|inspir|happy|positive/.test(k)) pool = pool.concat(MUSIC_LIBRARY.uplifting);
  if (/corporate|business|professional|success/.test(k) || pool.length === 0) {
    pool = pool.concat(MUSIC_LIBRARY.corporate);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

async function fetchMusicTrack(keywords: string): Promise<{ bytes: Uint8Array; sourceUrl: string }> {
  const sourceUrl = pickMusicUrl(keywords);
  const r = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KSE-NexusBot/1.0)",
      "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
    },
  });
  if (!r.ok) throw new Error(`Music fetch ${r.status} for ${sourceUrl}`);
  return { bytes: new Uint8Array(await r.arrayBuffer()), sourceUrl };
}

async function renderReelWithCreatomate(
  imageUrls: string[],
  musicUrl: string,
): Promise<Uint8Array> {
  const slideDuration = 5; // seconds per slide — enough time to read
  const totalDuration = imageUrls.length * slideDuration;

  // Each image goes on its own track with an explicit absolute `time`
  // so Creatomate places them sequentially in a deterministic way.
  // Animations use the documented schema: { time, duration, type, easing, ... }.
  const imageElements = imageUrls.map((url, i) => ({
    type: "image",
    track: i + 2, // track 1 is reserved for audio
    time: i * slideDuration,
    duration: slideDuration,
    source: url,
    fit: "cover",
    animations: [
      // Ken Burns zoom across the slide
      {
        type: "scale",
        time: 0,
        duration: slideDuration,
        easing: "linear",
        start_scale: "100%",
        end_scale: "110%",
      },
    ],
  }));

  const source = {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    frame_rate: 30,
    duration: totalDuration,
    elements: [
      ...imageElements,
      {
        type: "audio",
        track: 1,
        source: musicUrl,
        duration: totalDuration,
        audio_fade_in: 0.5,
        audio_fade_out: 1.5,
      },
    ],
  };

  // 1. Create render job
  const createRes = await fetch("https://api.creatomate.com/v1/renders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CREATOMATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source,
      output_format: "mp4",
      frame_rate: 30,
      width: 1080,
      height: 1920,
      render_scale: 1.0,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Creatomate create ${createRes.status}: ${await createRes.text()}`);
  }
  const createData = await createRes.json();
  const job = Array.isArray(createData) ? createData[0] : createData;
  const renderId: string = job.id;
  if (!renderId) throw new Error(`Creatomate: no render id in ${JSON.stringify(job)}`);

  // 2. Poll until succeeded
  let videoUrl = "";
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${CREATOMATE_KEY}` },
    });
    if (!s.ok) continue;
    const sd = await s.json();
    if (sd.status === "succeeded" && sd.url) {
      videoUrl = sd.url;
      break;
    }
    if (sd.status === "failed") {
      throw new Error(`Creatomate render failed: ${sd.error_message ?? JSON.stringify(sd)}`);
    }
  }
  if (!videoUrl) throw new Error("Creatomate render timed out after 3 minutes");

  const dl = await fetch(videoUrl);
  if (!dl.ok) throw new Error(`Download rendered video ${dl.status}`);
  return new Uint8Array(await dl.arrayBuffer());
}

async function postReelToInstagram(caption: string, videoUrl: string): Promise<string> {
  const createParams = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: "true",
    access_token: META_TOKEN,
  });
  const createRes = await fetch(`${GRAPH}/${IG_ID}/media`, {
    method: "POST",
    body: createParams,
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.id) {
    throw new Error(`Reel container failed: ${JSON.stringify(createData)}`);
  }
  const creationId = createData.id;

  // Poll status (Reels need encoding time)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const st = await fetch(
      `${GRAPH}/${creationId}?fields=status_code,status&access_token=${META_TOKEN}`,
    );
    const sd = await st.json();
    if (sd.status_code === "FINISHED") break;
    if (sd.status_code === "ERROR") {
      throw new Error(`Reel processing error: ${JSON.stringify(sd)}`);
    }
  }

  const pubParams = new URLSearchParams({ access_token: META_TOKEN, creation_id: creationId });
  const pubRes = await fetch(`${GRAPH}/${IG_ID}/media_publish`, {
    method: "POST",
    body: pubParams,
  });
  const pubData = await pubRes.json();
  if (!pubRes.ok || !pubData.id) {
    throw new Error(`Reel publish failed: ${JSON.stringify(pubData)}`);
  }
  return pubData.id as string;
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
  let video_url: string | null = null;
  try {
    if (type === "story") {
      const gen = await generateContent(type);
      caption = gen.caption;
      const headline = gen.headline!;
      const subtext = gen.subtext!;
      const height = 1920; // story format
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
    } else if (type === "reel") {
      // REEL = video slideshow with background music
      const gen = await generateContent("reel");
      caption = gen.caption;
      const slides = gen.slides!;
      const musicKeywords = gen.music_keywords ?? "corporate uplifting";
      slidesMeta = JSON.stringify({ slides, music_keywords: musicKeywords });

      const ts = Date.now();
      // 1. Render each slide as portrait PNG (1080x1920) and upload
      const imageUrls: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const num = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
        const png = await generateImage(s.headline, s.subtext, num, 1920);
        const u = await uploadImage(supabase, png, `reel_${ts}_slide_${i + 1}.png`);
        imageUrls.push(u);
      }
      image_url = imageUrls[0];

      // 2. Fetch royalty-free music from curated CDN library, upload to storage
      const { bytes: mp3 } = await fetchMusicTrack(musicKeywords);
      const musicUrl = await uploadBytes(supabase, mp3, `reel_${ts}_music.mp3`, "audio/mpeg");

      // 3. Render MP4 via Creatomate (slideshow + music)
      const mp4 = await renderReelWithCreatomate(imageUrls, musicUrl);
      video_url = await uploadBytes(supabase, mp4, `reel_${ts}.mp4`, "video/mp4");

      // 4. Publish as Instagram Reel
      let ig_media_id: string;
      try {
        ig_media_id = await postReelToInstagram(caption, video_url);
      } catch (e) {
        console.warn("Reel publish failed, retrying in 60s:", (e as Error).message);
        await new Promise((r) => setTimeout(r, 60_000));
        ig_media_id = await postReelToInstagram(caption, video_url);
      }
      await supabase
        .from("posts_log")
        .update({
          caption,
          image_url,
          image_prompt: slidesMeta,
          video_url,
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
        video_url,
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