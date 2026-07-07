import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Trash2, Archive, MailOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inbox")({ component: Inbox });

type Msg = {
  id: string; name: string; email: string; subject: string | null;
  message: string; is_read: boolean; is_archived: boolean; created_at: string;
};

function Inbox() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"inbox" | "archived">("inbox");
  const [selected, setSelected] = useState<Msg | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_messages")
      .select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setMsgs((data as Msg[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = msgs.filter((m) => filter === "archived" ? m.is_archived : !m.is_archived);

  const update = async (id: string, patch: Partial<Msg>) => {
    const { error } = await supabase.from("contact_messages").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setMsgs((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
    if (selected?.id === id) setSelected({ ...selected, ...patch });
  };

  const remove = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setMsgs((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Gelöscht");
  };

  const open = (m: Msg) => {
    setSelected(m);
    if (!m.is_read) update(m.id, { is_read: true });
  };

  return (
    <div className="p-8 max-w-7xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Kontaktanfragen</h1>
          <p className="text-sm text-muted-foreground">{msgs.filter(m => !m.is_read && !m.is_archived).length} ungelesen</p>
        </div>
        <div className="flex items-center gap-1 text-xs glass rounded-full p-1">
          {(["inbox", "archived"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setSelected(null); }}
              className={`px-3 py-1.5 rounded-full transition-colors ${filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f === "inbox" ? "Inbox" : "Archiv"}
            </button>
          ))}
        </div>
      </header>

      {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
        <div className="grid md:grid-cols-[360px_1fr] gap-4 min-h-[60vh]">
          <div className="glass rounded-2xl overflow-hidden">
            {visible.length === 0 && <p className="p-8 text-sm text-muted-foreground text-center">Keine Nachrichten.</p>}
            <ul className="divide-y divide-border">
              {visible.map((m) => (
                <li key={m.id}>
                  <button onClick={() => open(m)}
                    className={`w-full text-left p-4 hover:bg-card/40 transition-colors ${selected?.id === m.id ? "bg-card/60" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {!m.is_read && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                      <span className="font-medium text-sm truncate flex-1">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.subject || m.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6">
            {selected ? (
              <article>
                <header className="flex items-start justify-between gap-4 mb-5 pb-5 border-b border-border">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold truncate">{selected.subject || "(kein Betreff)"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      <a href={`mailto:${selected.email}`} className="text-accent hover:underline">{selected.name} &lt;{selected.email}&gt;</a>
                      <span className="ml-2">· {new Date(selected.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => update(selected.id, { is_read: !selected.is_read })}
                      className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground hover:text-foreground" title="Als (un)gelesen">
                      <MailOpen className="w-4 h-4" />
                    </button>
                    <button onClick={() => update(selected.id, { is_archived: !selected.is_archived })}
                      className="p-2 rounded-lg hover:bg-card/60 text-muted-foreground hover:text-foreground" title="Archivieren">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(selected.id)}
                      className="p-2 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive" title="Löschen">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </header>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Deine Anfrage")}`}
                  className="inline-flex items-center gap-2 mt-6 bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-sm font-medium glow-orange">
                  <Mail className="w-4 h-4" /> Antworten
                </a>
              </article>
            ) : (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">Wähle eine Nachricht</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}