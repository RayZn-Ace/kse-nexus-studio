import { supabase } from "@/integrations/supabase/client";

const KEY = "kse_sid";

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = localStorage.getItem(KEY);
  if (!sid) {
    sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, sid);
  }
  return sid;
}

export async function trackEvent(
  event_type: string,
  meta?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  try {
    await supabase.from("visitor_events").insert({
      session_id: getSessionId(),
      event_type,
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      meta: (meta ?? null) as never,
    });
  } catch {
    /* ignore */
  }
}