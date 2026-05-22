// One-time setup: subscribe the Page to webhook fields
// POST https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps

const META_TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";
const PAGE_ID = "811569008714670";
const FIELDS = [
  "messages",
  "messaging_postbacks",
  "message_reactions",
  "mention",
  "feed",
  "standby",
  "messaging_handovers",
].join(",");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (!META_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: "META_ACCESS_TOKEN not configured" }), {
        status: 500,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/subscribed_apps`;
    const form = new URLSearchParams({
      subscribed_fields: FIELDS,
      access_token: META_TOKEN,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log("[subscribe] status:", res.status, "body:", text);

    return new Response(JSON.stringify({ ok: res.ok, status: res.status, response: data, fields: FIELDS.split(",") }), {
      status: 200,
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e: any) {
    console.error("[subscribe] error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 200,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});