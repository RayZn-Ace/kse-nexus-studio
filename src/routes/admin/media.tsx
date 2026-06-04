import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Copy, Check, Loader2, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/media")({ component: MediaPage });

type MediaItem = {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string } | null;
};

function publicUrlFor(path: string) {
  // Always use the production domain so links work in emails / signatures,
  // even when copied from the sandbox preview.
  const PROD_ORIGIN = "https://ksegroup.eu";
  return `${PROD_ORIGIN}/api/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from("media")
      .list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) toast.error(error.message);
    setItems((data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder") as MediaItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
      }
      toast.success("Hochgeladen");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (name: string) => {
    if (!confirm(`"${name}" löschen?`)) return;
    const { error } = await supabase.storage.from("media").remove([name]);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
      toast.success("Link kopiert");
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1">Medien</h1>
          <p className="text-sm text-muted-foreground">
            Bilder & Dateien hochladen. Jeder Eintrag bekommt einen festen öffentlichen Link – ideal für E-Mail-Signaturen.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Lade hoch…" : "Datei hochladen"}
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </header>

      {loading ? (
        <div className="grid place-items-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Noch keine Dateien. Lade oben deine erste Datei hoch.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const url = publicUrlFor(it.name);
            const isImage = (it.metadata?.mimetype ?? "").startsWith("image/");
            return (
              <div key={it.id ?? it.name} className="glass rounded-xl overflow-hidden">
                <div className="aspect-video bg-black/40 grid place-items-center overflow-hidden">
                  {isImage ? (
                    <img src={url} alt={it.name} className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium truncate" title={it.name}>{it.name}</p>
                  <div className="flex items-center gap-1.5 bg-card/60 border border-border rounded-md p-1.5">
                    <input
                      readOnly
                      value={url}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 bg-transparent text-[10px] outline-none truncate"
                    />
                    <button
                      onClick={() => copy(url)}
                      className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground"
                      title="Link kopieren"
                    >
                      {copied === url ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <button
                    onClick={() => remove(it.name)}
                    className="w-full text-[11px] px-2 py-1.5 rounded-md border border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 inline-flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Löschen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}