import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2, Film, Download } from "lucide-react";

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
                    <a href={urls[t.video_path]} download={`${t.title}.webm`}
                      className="flex-1 text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-card inline-flex items-center justify-center gap-1">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                  <button onClick={() => remove(t)}
                    className="text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}