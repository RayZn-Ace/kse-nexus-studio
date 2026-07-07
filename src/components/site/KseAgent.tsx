import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Was macht die KSE Group?",
  "Zeig mir eure Cases",
  "Ich hab ein Website-Projekt",
  "Was kann euer AI-Team?",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi, ich bin NOVA — der digitale Concierge der KSE Group. Frag mich alles über unsere Projekte, unser Team oder was wir für dich bauen können.",
};

export function KseAgent() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/kse-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { content?: string; error?: string };
      const content = data.content ?? data.error ?? "Sorry, da ist was schiefgelaufen.";
      setMessages([...next, { role: "assistant", content }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: "Verbindung fehlgeschlagen. Bitte kurz später erneut versuchen." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat mit NOVA öffnen"
        className={`fixed bottom-24 right-4 md:bottom-28 md:right-6 z-[70] grid place-items-center h-14 w-14 md:h-16 md:w-16 rounded-full bg-[#ffeb3b] border-4 border-[#0a0a0a] shadow-[6px_6px_0_#0a0a0a] hover:shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ transitionProperty: "transform, box-shadow, opacity" }}
      >
        {open ? (
          <X className="h-6 w-6 md:h-7 md:w-7 text-[#0a0a0a]" strokeWidth={3} />
        ) : (
          <Bot className="h-6 w-6 md:h-7 md:w-7 text-[#0a0a0a]" strokeWidth={2.5} />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#ff5722] border-2 border-[#0a0a0a] animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-2 bottom-44 md:inset-x-auto md:right-6 md:bottom-48 md:w-[380px] z-[69] flex flex-col max-h-[70vh] bg-white border-4 border-[#0a0a0a] shadow-[8px_8px_0_#0a0a0a]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b-4 border-[#0a0a0a] bg-[#ffeb3b] px-4 py-3">
            <div className="grid place-items-center h-9 w-9 rounded-full bg-[#0a0a0a]">
              <Bot className="h-5 w-5 text-[#ffeb3b]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-black text-sm text-[#0a0a0a] leading-tight">AGENT-07 · NOVA</div>
              <div className="text-[10px] uppercase tracking-wider text-[#0a0a0a]/70">KSE Group · Online</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Schließen"
              className="p-1 hover:bg-[#0a0a0a]/10 rounded"
            >
              <X className="h-4 w-4 text-[#0a0a0a]" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed border-2 border-[#0a0a0a] ${
                    m.role === "user"
                      ? "bg-[#ff5722] text-white"
                      : "bg-[#f4f4f4] text-[#0a0a0a]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 border-2 border-[#0a0a0a] bg-[#f4f4f4] text-[#0a0a0a] flex items-center gap-2 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> NOVA tippt…
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="pt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="text-xs px-2 py-1 border-2 border-[#0a0a0a] bg-white hover:bg-[#ffeb3b] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t-4 border-[#0a0a0a] bg-white p-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Frag NOVA…"
              className="flex-1 px-3 py-2 border-2 border-[#0a0a0a] bg-white text-sm focus:outline-none focus:bg-[#ffeb3b]/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Senden"
              className="grid place-items-center h-10 w-10 bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] hover:bg-[#ff5722] disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="border-t-2 border-[#0a0a0a]/10 px-3 py-1.5 text-[10px] text-[#0a0a0a]/50 bg-white">
            AI · kann Fehler machen · nenn keine sensiblen Daten
          </div>
        </div>
      )}
    </>
  );
}