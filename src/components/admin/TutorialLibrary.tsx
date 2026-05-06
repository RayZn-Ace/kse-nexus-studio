import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, Film, Download, Share2, Copy, Check } from "lucide-react";

function saveBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

type Tutorial = {
  id: string;
  title: string;
  video_path: string;
  duration_seconds: number | null;
  created_at: string;
};

export function TutorialLibrary() {
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [shareUrl, setShareUrl] = useState<{ id: string; url: string } | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: "fetch" | "save"; pct: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutorials")
      .select("id,title,video_path,duration_seconds,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("tutorials:refresh", handler);
    return () => window.removeEventListener("tutorials:refresh", handler);
  }, []);

  const sign = async (path: string) => {
    if (urls[path]) return urls[path];
    const { data } = await supabase.storage.from("tutorials").createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setUrls((u) => ({ ...u, [path]: data.signedUrl }));
      return data.signedUrl;
    }
    return null;
  };

  useEffect(() => {
    items.forEach((t) => sign(t.video_path));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const remove = async (t: Tutorial) => {
    if (!confirm(`"${t.title}" wirklich löschen?`)) return;
    const { error: sErr } = await supabase.storage.from("tutorials").remove([t.video_path]);
    if (sErr) console.warn(sErr);
    const { error } = await supabase.from("tutorials").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  const share = async (t: Tutorial) => {
    setSharing(t.id);
    try {
      const token =
        (crypto as any).randomUUID?.().replace(/-/g, "") ??
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      const { error } = await supabase
        .from("tutorial_shares")
        .insert({ tutorial_id: t.id, token });
      if (error) throw error;
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl({ id: t.id, url });
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Share-Link kopiert");
      } catch {
        toast.success("Share-Link erstellt");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Share fehlgeschlagen");
    } finally {
      setSharing(null);
    }
  };

  const copyShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const downloadVideo = async (url: string, t: Tutorial) => {
    setDownloading(t.id);
    setProgress({ stage: "fetch", pct: 0 });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const total = Number(res.headers.get("content-length") || 0);
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      if (reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          if (total) setProgress({ stage: "fetch", pct: Math.round((loaded / total) * 100) });
        }
      } else {
        chunks.push(new Uint8Array(await res.arrayBuffer()));
      }
      const blob = new Blob(chunks as BlobPart[]);
      let mp4Blob: Blob;
      if (t.video_path.toLowerCase().endsWith(".mp4")) {
        mp4Blob = blob;
      } else {
        setProgress({ stage: "prepare", pct: 1 });
        mp4Blob = await webmToMp4(blob, (pct, mode) => {
          const stage = mode === "prepare" ? "prepare" : mode === "remux" ? "remux" : "convert";
          setProgress({ stage, pct });
        });
      }
      setProgress({ stage: "save", pct: 100 });
      saveBlob(mp4Blob, `${slug(t.title)}.mp4`);
      toast.success("MP4-Download gestartet");
    } catch (e: any) {
      console.error("MP4 download failed", e);
      toast.error(e.message ?? "MP4-Download fehlgeschlagen");
    } finally {
      setDownloading(null);
      setProgress(null);
    }
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Bibliothek</h2>
          <p className="text-xs text-muted-foreground">{items.length} Aufnahme{items.length === 1 ? "" : "n"}</p>
        </div>
      </div>
      {loading ? (
        <div className="grid place-items-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Noch keine Tutorials. Erstelle deine erste Aufnahme oben.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t.id} className="glass rounded-xl overflow-hidden group">
              {urls[t.video_path] ? (
                <video src={urls[t.video_path]} controls className="w-full aspect-video bg-black" />
              ) : (
                <div className="w-full aspect-video bg-black/60 grid place-items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="p-3">
                <p className="font-medium text-sm truncate">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(t.created_at).toLocaleString("de-DE")}
                  {t.duration_seconds ? ` · ${Math.floor(t.duration_seconds / 60)}:${String(t.duration_seconds % 60).padStart(2, "0")}` : ""}
                </p>
                <div className="flex gap-1.5 mt-2">
                  {urls[t.video_path] && (
                    <button
                      type="button"
                      onClick={() => downloadVideo(urls[t.video_path], t)}
                      disabled={downloading === t.id}
                      className="flex-1 text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-card inline-flex items-center justify-center gap-1 disabled:opacity-50">
                      {downloading === t.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {progress
                            ? `${progress.stage === "fetch" ? "Lade" : progress.stage === "prepare" ? "Bereite vor" : progress.stage === "remux" ? "Erstelle MP4" : progress.stage === "convert" ? "Konvertiere" : "Speichere"} ${progress.pct}%`
                            : "…"}
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" /> MP4 Download
                        </>
                      )}
                    </button>
                  )}
                  <button onClick={() => share(t)} disabled={sharing === t.id}
                    className="text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-accent/10 hover:text-accent hover:border-accent/40 inline-flex items-center gap-1">
                    {sharing === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
                  </button>
                  <button onClick={() => remove(t)}
                    className="text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {shareUrl?.id === t.id && (
                  <div className="mt-2 flex items-center gap-1.5 bg-card/60 border border-border rounded-md p-1.5">
                    <input
                      readOnly
                      value={shareUrl.url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 bg-transparent text-[10px] outline-none truncate"
                    />
                    <button onClick={() => copyShare(shareUrl.url)}
                      className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tutorial";
}