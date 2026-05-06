import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

const resolveShare = createServerOnlyFn(async (token: string) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: share, error } = await supabaseAdmin
    .from("tutorial_shares")
    .select("id, tutorial_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!share) return { ok: false as const, reason: "not_found" as const };
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const };
  }

  const { data: tut, error: tErr } = await supabaseAdmin
    .from("tutorials")
    .select("id, title, video_path, duration_seconds, created_at")
    .eq("id", share.tutorial_id)
    .maybeSingle();
  if (tErr) throw new Error(tErr.message);
  if (!tut) return { ok: false as const, reason: "not_found" as const };

  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from("tutorials")
    .createSignedUrl(tut.video_path, 60 * 60 * 6);
  if (sErr || !signed?.signedUrl) {
    throw new Error(sErr?.message ?? "Signed URL fehlgeschlagen");
  }

  const ext = tut.video_path.toLowerCase().endsWith(".mp4") ? "mp4" : "webm";
  return {
    ok: true as const,
    tutorial: {
      title: tut.title,
      duration_seconds: tut.duration_seconds,
      created_at: tut.created_at,
      video_url: signed.signedUrl,
      ext,
    },
  };
});

export const getShare = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = data as { token?: string };
    if (!d?.token || typeof d.token !== "string") throw new Error("Token fehlt");
    return { token: d.token };
  })
  .handler(async ({ data }) => {
    return resolveShare(data.token);
  });