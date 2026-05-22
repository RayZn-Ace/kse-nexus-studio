// One-time setup: subscribe the Page to webhook fields
// POST https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps

const META_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? Deno.env.get("META_ACCESS_TOKEN") ?? "";
const PAGE_ID = "1065280196677910";
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

    // Step 1: Exchange user token for a Page Access Token.
    // Error (#210) means META_ACCESS_TOKEN is a USER token, not a PAGE token.
    // We try /me/accounts first, then fall back to /{PAGE_ID}?fields=access_token.
    let pageToken = META_TOKEN;
    let tokenSource = "input (assumed page token)";
    let tokenDebug: any = null;

    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${encodeURIComponent(META_TOKEN)}`,
    );
    const accountsJson = await accountsRes.json().catch(() => ({}));
    tokenDebug = { accountsStatus: accountsRes.status, accountsBody: accountsJson };

    if (accountsRes.ok && Array.isArray(accountsJson?.data)) {
      const match = accountsJson.data.find((p: any) => String(p.id) === PAGE_ID);
      if (match?.access_token) {
        pageToken = match.access_token;
        tokenSource = "/me/accounts";
      }
    }

    if (pageToken === META_TOKEN) {
      // Fallback: directly request the page access_token
      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/${PAGE_ID}?fields=access_token&access_token=${encodeURIComponent(META_TOKEN)}`,
      );
      const pageJson = await pageRes.json().catch(() => ({}));
      tokenDebug.pageStatus = pageRes.status;
      tokenDebug.pageBody = pageJson;
      if (pageRes.ok && pageJson?.access_token) {
        pageToken = pageJson.access_token;
        tokenSource = "/{PAGE_ID}?fields=access_token";
      }
    }

    // Step 2: subscribe the app to the page with the (hopefully) page token
    const url = `https://graph.facebook.com/v21.0/${PAGE_ID}/subscribed_apps`;
    const form = new URLSearchParams({
      subscribed_fields: FIELDS,
      access_token: pageToken,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    console.log("[subscribe] tokenSource:", tokenSource, "status:", res.status, "body:", text);

    return new Response(JSON.stringify({
      ok: res.ok,
      status: res.status,
      response: data,
      fields: FIELDS.split(","),
      tokenSource,
      tokenDebug,
      hint: res.ok ? undefined : "Falls #210: META_PAGE_ACCESS_TOKEN muss ein Page Access Token der Page 1065280196677910 sein (oder ein User Token mit pages_manage_metadata, pages_show_list, instagram_basic, instagram_manage_messages).",
    }), {
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