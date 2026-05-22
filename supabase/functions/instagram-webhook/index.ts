// Instagram Webhook: DMs, Comments, Story Replies -> Claude auto-reply
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFY_TOKEN = Deno.env.get("WEBHOOK_VERIFY_TOKEN") ?? "";
const META_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? Deno.env.get("META_ACCESS_TOKEN") ?? "";
const IG_ACCOUNT_ID = Deno.env.get("META_IG_ACCOUNT_ID") ?? "";
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function getConfig() {
  const { data } = await supa.from("chatbot_config").select("key,value");
  const out: Record<string, any> = {};
  (data ?? []).forEach((r: any) => { out[r.key] = r.value; });
  return out;
}

async function getTodayResponseCount(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count } = await supa
    .from("messages_log")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("created_at", start.toISOString());
  return count ?? 0;
}

function containsBlacklistedWord(text: string, blacklist: string): boolean {
  if (!blacklist || !text) return false;
  const words = blacklist.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
}

async function logMessage(row: {
  type: string;
  sender_id?: string | null;
  sender_username?: string | null;
  incoming_text?: string | null;
  outgoing_text?: string | null;
  status: string;
  error_message?: string | null;
  post_id?: string | null;
}) {
  await supa.from("messages_log").insert(row);
}

async function generateReply(type: string, incoming: string, systemPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      system: `${systemPrompt}\n\nKontext: Diese Nachricht ist ein ${type === "dm" ? "Direct Message" : type === "comment" ? "Instagram-Kommentar" : "Story-Reply"}.`,
      messages: [{ role: "user", content: incoming }],
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? "";
}

async function sendDM(recipientId: string, message: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: META_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`sendDM ${res.status}: ${await res.text()}`);
}

async function replyToComment(commentId: string, message: string) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: META_TOKEN }),
  });
  if (!res.ok) throw new Error(`replyToComment ${res.status}: ${await res.text()}`);
}

async function handleDM(senderId: string, message: string) {
  const config = await getConfig();
  if (config.enabled === false) return;
  if (config.auto_reply_dm === false) return;
  if (!message) return;

  const limit = parseInt(String(config.max_daily_responses ?? 500));
  const today = await getTodayResponseCount();
  if (today >= limit) {
    await logMessage({ type: "dm", sender_id: senderId, incoming_text: message, status: "skipped", error_message: "Daily limit reached" });
    return;
  }

  if (containsBlacklistedWord(message, String(config.blacklist_words ?? ""))) {
    await logMessage({ type: "dm", sender_id: senderId, incoming_text: message, status: "skipped", error_message: "Blacklist match" });
    return;
  }

  try {
    const reply = await generateReply("dm", message, String(config.kse_context ?? ""));
    await sendDM(senderId, reply);
    await logMessage({ type: "dm", sender_id: senderId, incoming_text: message, outgoing_text: reply, status: "sent" });
  } catch (e: any) {
    await logMessage({ type: "dm", sender_id: senderId, incoming_text: message, status: "failed", error_message: e.message });
  }
}

async function handleComment(data: any) {
  const config = await getConfig();
  if (config.enabled === false) return;
  if (config.auto_reply_comments === false) return;
  if (!data?.text) return;

  const fromId = data.from?.id ?? null;
  if (fromId && IG_ACCOUNT_ID && fromId === IG_ACCOUNT_ID) return;

  const limit = parseInt(String(config.max_daily_responses ?? 500));
  const today = await getTodayResponseCount();
  if (today >= limit) {
    await logMessage({ type: "comment", sender_id: fromId, sender_username: data.from?.username, incoming_text: data.text, status: "skipped", error_message: "Daily limit reached", post_id: data.media?.id });
    return;
  }

  if (containsBlacklistedWord(data.text, String(config.blacklist_words ?? ""))) {
    await logMessage({ type: "comment", sender_id: fromId, sender_username: data.from?.username, incoming_text: data.text, status: "skipped", error_message: "Blacklist match", post_id: data.media?.id });
    return;
  }

  try {
    const reply = await generateReply("comment", data.text, String(config.kse_context ?? ""));
    await replyToComment(data.id, reply);
    await logMessage({ type: "comment", sender_id: fromId, sender_username: data.from?.username, incoming_text: data.text, outgoing_text: reply, status: "sent", post_id: data.media?.id });
  } catch (e: any) {
    await logMessage({ type: "comment", sender_id: fromId, sender_username: data.from?.username, incoming_text: data.text, status: "failed", error_message: e.message, post_id: data.media?.id });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Verification
  if (req.method === "GET") {
    const params = new URL(req.url).searchParams;
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");
    console.log("[webhook] GET verify", { mode, tokenMatch: token === VERIFY_TOKEN, hasChallenge: !!challenge });
    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("ok", { status: 200, headers: cors });
  }

  let rawBody = "";
  try {
    rawBody = await req.text();
    console.log("[webhook] POST raw body:", rawBody);
    let body: any = {};
    try { body = JSON.parse(rawBody); } catch (_) {
      console.error("[webhook] body not JSON");
      await logMessage({ type: "debug", incoming_text: rawBody, status: "failed", error_message: "non-JSON body" });
      return new Response("EVENT_RECEIVED", { status: 200, headers: cors });
    }
    console.log("[webhook] parsed object:", JSON.stringify(body));

    // Always log raw payload for debugging visibility
    await logMessage({
      type: "debug",
      incoming_text: JSON.stringify(body).slice(0, 8000),
      status: "pending",
    });

    const entries = body.entry ?? [];
    let handledAny = false;

    for (const entry of entries) {
      // DMs (messaging)
      if (Array.isArray(entry.messaging)) {
        for (const event of entry.messaging) {
          handledAny = true;
          console.log("[webhook] messaging event:", JSON.stringify(event));
          if (event.message && !event.message.is_echo && event.message.text) {
            // Story replies arrive as messaging events with reply_to.story
            const isStoryReply = !!event.message.reply_to?.story;
            if (isStoryReply) {
              const config = await getConfig();
              if (config.enabled === false || config.auto_reply_story === false) continue;
              try {
                const reply = await generateReply("story_reply", event.message.text, String(config.kse_context ?? ""));
                await sendDM(event.sender.id, reply);
                await logMessage({ type: "story_reply", sender_id: event.sender.id, incoming_text: event.message.text, outgoing_text: reply, status: "sent" });
              } catch (e: any) {
                await logMessage({ type: "story_reply", sender_id: event.sender.id, incoming_text: event.message.text, status: "failed", error_message: e.message });
              }
            } else {
              await handleDM(event.sender.id, event.message.text);
            }
          }
        }
      }

      // Comments + other change events (page messaging format)
      if (Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          handledAny = true;
          console.log("[webhook] change event:", JSON.stringify(change));
          if (change.field === "comments") {
            await handleComment(change.value);
          } else if (change.field === "messages") {
            // Page messaging format
            const v = change.value ?? {};
            const senderId = v.sender?.id ?? v.from?.id ?? null;
            const text = v.message?.text ?? v.text ?? "";
            if (senderId && text) {
              await handleDM(senderId, text);
            } else {
              await logMessage({ type: "debug", incoming_text: JSON.stringify(change), status: "skipped", error_message: "messages change without sender/text" });
            }
          } else {
            await logMessage({ type: "debug", incoming_text: JSON.stringify(change), status: "skipped", error_message: `unhandled change field: ${change.field}` });
          }
        }
      }
    }

    if (!handledAny) {
      console.warn("[webhook] no messaging/changes entries found");
      await logMessage({ type: "debug", incoming_text: JSON.stringify(body).slice(0, 8000), status: "skipped", error_message: "no messaging/changes in payload" });
    }

    return new Response("EVENT_RECEIVED", { status: 200, headers: cors });
  } catch (e: any) {
    console.error("[webhook] error", e);
    try {
      await logMessage({ type: "debug", incoming_text: rawBody.slice(0, 8000), status: "failed", error_message: e?.message ?? String(e) });
    } catch (_) { /* swallow */ }
    // ALWAYS return 200 so Meta keeps delivering
    return new Response("EVENT_RECEIVED", { status: 200, headers: cors });
  }
});