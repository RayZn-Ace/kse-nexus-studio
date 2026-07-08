import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Check, CheckCheck, Search, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/chats")({
  head: () => ({ meta: [{ title: "Direktchats — KSE Kommandozentrale" }, { name: "robots", content: "noindex" }] }),
  component: ChatsPage,
});

type Msg = {
  id: string;
  token: string;
  from_role: "client" | "kse";
  body: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
};

type Convo = {
  token: string;
  last: Msg;
  unread: number;
  total: number;
};

function relTime(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "jetzt";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function ChatsPage() {
  const [all, setAll] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load all + subscribe realtime
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("portal_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!mounted) return;
      setAll((data || []) as Msg[]);
      setLoading(false);

      // Mark client messages as delivered upon admin load
      const undelivered = ((data || []) as Msg[])
        .filter((m) => m.from_role === "client" && !m.delivered_at)
        .map((m) => m.id);
      if (undelivered.length) {
        await supabase
          .from("portal_messages")
          .update({ delivered_at: new Date().toISOString() })
          .in("id", undelivered);
      }
    })();

    const channel = supabase
      .channel("portal:admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "portal_messages" },
        async (payload) => {
          const m = payload.new as Msg;
          setAll((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.from_role === "client" && !m.delivered_at) {
            await supabase
              .from("portal_messages")
              .update({ delivered_at: new Date().toISOString() })
              .eq("id", m.id);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "portal_messages" },
        (payload) => {
          const m = payload.new as Msg;
          setAll((prev) => prev.map((x) => (x.id === m.id ? m : x)));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Group into conversations
  const convos: Convo[] = useMemo(() => {
    const map = new Map<string, Msg[]>();
    for (const m of all) {
      const arr = map.get(m.token) || [];
      arr.push(m);
      map.set(m.token, arr);
    }
    const list: Convo[] = [];
    for (const [token, arr] of map) {
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
      const last = arr[arr.length - 1];
      const unread = arr.filter((m) => m.from_role === "client" && !m.read_at).length;
      list.push({ token, last, unread, total: arr.length });
    }
    list.sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((c) => c.token.toLowerCase().includes(q) || c.last.body.toLowerCase().includes(q));
  }, [all, search]);

  // Auto-select first / persist selection
  useEffect(() => {
    if (!activeToken && convos.length > 0) setActiveToken(convos[0].token);
  }, [convos, activeToken]);

  const activeMsgs = useMemo(
    () => all.filter((m) => m.token === activeToken).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [all, activeToken],
  );

  // Mark all client messages in the active thread as read
  useEffect(() => {
    if (!activeToken) return;
    const unread = activeMsgs.filter((m) => m.from_role === "client" && !m.read_at).map((m) => m.id);
    if (!unread.length) return;
    supabase
      .from("portal_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread);
  }, [activeToken, activeMsgs]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMsgs.length, activeToken]);

  async function send() {
    const text = draft.trim();
    if (!text || !activeToken || sending) return;
    setSending(true);
    setDraft("");
    const { error } = await supabase
      .from("portal_messages")
      .insert({ token: activeToken, from_role: "kse", body: text });
    if (error) {
      setDraft(text);
      alert("Senden fehlgeschlagen.");
    }
    setSending(false);
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b-2 border-[#0a0a0a] bg-white">
        <div className="inline-block bg-[#0a0a0a] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.3em] mb-2">
          ◆ Direktkanäle · Live
        </div>
        <h1 className="font-black uppercase tracking-tighter text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          Chats mit <span className="text-[#ff5722]">Kunden</span>
        </h1>
      </div>

      {loading ? (
        <div className="flex-1 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#ff5722]" />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Sidebar with conversations */}
          <aside className="w-80 border-r-2 border-[#0a0a0a] bg-white flex flex-col">
            <div className="p-3 border-b-2 border-[#0a0a0a]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0a0a0a]/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chats suchen…"
                  className="w-full pl-8 pr-3 py-2 border-2 border-[#0a0a0a] bg-[#f5f2ea] text-xs font-bold focus:outline-none focus:bg-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convos.length === 0 && (
                <div className="p-6 text-center text-xs text-[#0a0a0a]/50 font-black uppercase tracking-widest">
                  Noch keine Nachrichten
                </div>
              )}
              {convos.map((c) => {
                const active = c.token === activeToken;
                return (
                  <button
                    key={c.token}
                    onClick={() => setActiveToken(c.token)}
                    className={`w-full text-left p-3 border-b-2 border-[#0a0a0a]/10 flex gap-3 items-start transition-colors ${
                      active ? "bg-[#0a0a0a] text-white" : "hover:bg-[#f5f2ea]"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 border-2 grid place-items-center shrink-0 font-black text-sm ${
                        active ? "border-white bg-[#ff5722]" : "border-[#0a0a0a] bg-[#ff5722] text-white"
                      }`}
                    >
                      {c.token.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-black text-sm uppercase tracking-tight truncate">
                          {c.token.slice(0, 14)}
                        </div>
                        <div className={`text-[9px] font-black uppercase shrink-0 ${active ? "text-white/60" : "text-[#0a0a0a]/50"}`}>
                          {relTime(c.last.created_at)}
                        </div>
                      </div>
                      <div className={`text-xs truncate mt-0.5 ${active ? "text-white/70" : "text-[#0a0a0a]/60"}`}>
                        {c.last.from_role === "kse" && <span className="opacity-60">Du: </span>}
                        {c.last.body}
                      </div>
                      {c.unread > 0 && !active && (
                        <div className="mt-1 inline-block bg-[#ff5722] text-white px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest">
                          {c.unread} neu
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Chat pane */}
          <section className="flex-1 flex flex-col min-w-0 bg-[#f5f2ea]">
            {activeToken ? (
              <>
                <div className="p-3 md:p-4 border-b-2 border-[#0a0a0a] bg-white flex items-center justify-between">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50">Mission</div>
                    <div className="font-black uppercase text-lg tracking-tight">#{activeToken.slice(0, 16)}</div>
                  </div>
                  <a
                    href={`/mission/${activeToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-[#0a0a0a] bg-white hover:bg-[#0a0a0a] hover:text-white"
                  >
                    Portal öffnen <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
                  {activeMsgs.map((m) => {
                    const mine = m.from_role === "kse";
                    const status = m.read_at ? "read" : m.delivered_at ? "delivered" : "sent";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] border-2 border-[#0a0a0a] p-3 ${mine ? "bg-[#0a0a0a] text-white" : "bg-white"}`}>
                          <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                            {mine ? "Du (KSE)" : "Kunde"} · {relTime(m.created_at)}
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                          {mine && (
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-90">
                              {status === "sent" && <Check className="w-3 h-3" />}
                              {status === "delivered" && <CheckCheck className="w-3.5 h-3.5" />}
                              {status === "read" && <CheckCheck className="w-3.5 h-3.5 text-[#7dd3fc]" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 md:p-4 border-t-2 border-[#0a0a0a] bg-white flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Antwort schreiben…"
                    disabled={sending}
                    className="flex-1 border-2 border-[#0a0a0a] px-3 py-2.5 text-sm bg-[#f5f2ea] focus:outline-none focus:bg-white"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    className="px-4 py-2 border-2 border-[#0a0a0a] bg-[#ff5722] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Senden
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-[#0a0a0a]/50">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <div className="text-xs font-black uppercase tracking-widest">Wähle einen Chat</div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}