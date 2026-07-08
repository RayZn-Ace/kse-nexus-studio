import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2, Circle, Clock, FileText, MessageSquare, Rocket, Star,
  Download, ExternalLink, Sparkles, Target, Zap, Calendar,
} from "lucide-react";

export const Route = createFileRoute("/mission/$token")({
  head: ({ params }) => ({
    meta: [
      { title: `Mission ${params.token?.slice(0, 6).toUpperCase()} — KSE Group` },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Dein privates Missions-Portal bei KSE Group." },
    ],
  }),
  component: MissionPortal,
});

// Deterministic RNG
function hash(str: string) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed: number) { return function () { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function pick<T>(rnd: () => number, arr: T[]) { return arr[Math.floor(rnd() * arr.length)]; }

const CLIENTS = [
  { name: "Weinberg Immobilien GmbH", scope: "Website + AI-Chatbot", contact: "Julia Weinberg" },
  { name: "Nordlicht Coffee Roasters", scope: "E-Commerce + Branding", contact: "Marek Larsen" },
  { name: "Studio Aurora", scope: "Rebrand + Portfolio-Site", contact: "Anna Ferber" },
  { name: "Bäckerei Kramer & Söhne", scope: "Marketing-Automation", contact: "Ferdinand Kramer" },
  { name: "Hannover Legal Partners", scope: "Corporate Site + SEO", contact: "Dr. Elena Vogt" },
  { name: "Vitalis Physio", scope: "Buchungssystem + Landing", contact: "Sarah Beckmann" },
];

const MILESTONES = [
  { key: "discovery", label: "Discovery-Call",       desc: "Ziele, Zielgruppe, Scope definiert" },
  { key: "concept",   label: "Konzept & Wireframes", desc: "Struktur, Copy & Flows abgestimmt" },
  { key: "design",    label: "Design-Sprint",        desc: "Visual Language, Screens, Prototyp" },
  { key: "build",     label: "Umsetzung",            desc: "Development, Integrationen, Content" },
  { key: "qa",        label: "QA & Testing",         desc: "Performance, SEO, Accessibility" },
  { key: "launch",    label: "Launch",               desc: "Go-Live, Monitoring, Handover" },
];

const UPDATES = [
  "Erster Prototyp im Browser klickbar.",
  "Hero-Video final gerendert und eingebaut.",
  "Neuer Copy-Draft für die Startseite abgestimmt.",
  "Backend-Integration mit CRM steht.",
  "Performance-Score 98 auf Mobile erreicht.",
  "AI-Chatbot mit Wissensbasis verknüpft.",
  "SEO-Audit abgeschlossen, alle Kritischen behoben.",
  "Analytics & Conversion-Tracking scharf geschaltet.",
];

const FILES = [
  { name: "Konzept-Deck-v3.pdf",     size: "2.4 MB",  type: "PDF" },
  { name: "Wireframes-Final.fig",    size: "18.1 MB", type: "FIG" },
  { name: "Brand-Guidelines.pdf",    size: "5.7 MB",  type: "PDF" },
  { name: "Content-Sheet.xlsx",      size: "312 KB",  type: "XLS" },
  { name: "Launch-Checkliste.pdf",   size: "890 KB",  type: "PDF" },
];

function MissionPortal() {
  const { token } = Route.useParams();
  const seed = hash(token || "mission");
  const rnd = mulberry32(seed);

  const client = pick(rnd, CLIENTS);
  const activeIdx = 2 + Math.floor(rnd() * 3); // 2..4
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (14 + Math.floor(rnd() * 40)));
  const launchDate = new Date(startDate);
  launchDate.setDate(launchDate.getDate() + 45 + Math.floor(rnd() * 30));

  const [milestones, setMilestones] = useState(() =>
    MILESTONES.map((m, i) => ({
      ...m,
      status: i < activeIdx ? "done" : i === activeIdx ? "active" : "todo",
    }))
  );

  const updates = useMemo(() => {
    const arr: { day: number; text: string }[] = [];
    for (let i = 0; i < 6; i++) {
      arr.push({ day: Math.floor(rnd() * 40) + 1, text: pick(rnd, UPDATES) });
    }
    return arr.sort((a, b) => b.day - a.day);
  }, [token]);

  const [msgs, setMsgs] = useState<{ from: "kse" | "client"; text: string; time: string }[]>(() => [
    { from: "kse", text: `Willkommen ${client.contact.split(" ")[0]}! Hier findest du alles zur Mission "${client.scope}".`, time: "vor 3 Tagen" },
    { from: "client", text: "Sieht mega aus 🚀 Wann können wir die neue Version live sehen?", time: "vor 2 Tagen" },
    { from: "kse", text: "Prototyp ist heute Abend deploybar — Link folgt via Mail.", time: "vor 1 Tag" },
  ]);
  const [draft, setDraft] = useState("");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const doneCount = milestones.filter(m => m.status === "done").length;
  const progress = Math.round((doneCount / MILESTONES.length) * 100);

  function markDone(idx: number) {
    setMilestones(prev => prev.map((m, i) => {
      if (i < idx) return { ...m, status: "done" };
      if (i === idx) return { ...m, status: "done" };
      if (i === idx + 1 && m.status === "todo") return { ...m, status: "active" };
      return m;
    }));
  }

  function sendMsg() {
    if (!draft.trim()) return;
    setMsgs(prev => [...prev, { from: "client", text: draft.trim(), time: "gerade eben" }]);
    setDraft("");
    setTimeout(() => {
      setMsgs(prev => [...prev, { from: "kse", text: "Danke für dein Feedback — wir melden uns kurzfristig!", time: "gerade eben" }]);
    }, 900);
  }

  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      {/* Header */}
      <header className="border-b-2 border-[#0a0a0a] bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff5722] border-2 border-[#0a0a0a] grid place-items-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="font-black uppercase tracking-tight text-sm" style={{ fontFamily: "var(--font-display)" }}>KSE Group</div>
          </Link>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50 font-mono">
            MISSION #{token?.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-block bg-[#ff5722] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
            ◆ Privates Missions-Portal
          </div>
          <h1 className="font-black uppercase tracking-tighter leading-[0.9] text-4xl md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
            {client.name}
          </h1>
          <p className="mt-3 text-base md:text-lg text-[#0a0a0a]/70">
            {client.scope} · geleitet für <span className="font-black">{client.contact}</span>
          </p>

          {/* Progress */}
          <div className="mt-6 border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/60">Missions-Fortschritt</div>
                <div className="font-black text-4xl mt-1 tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                  {progress}<span className="text-[#ff5722]">%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" /> Ziel-Launch
                </div>
                <div className="font-black text-lg mt-1">{launchDate.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
            </div>
            <div className="h-3 bg-[#f5f2ea] border-2 border-[#0a0a0a] overflow-hidden">
              <div className="h-full bg-[#ff5722] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Milestones */}
        <section className="mb-10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">/ Meilensteine</h2>
          <div className="border-2 border-[#0a0a0a] bg-white" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
            {milestones.map((m, i) => (
              <div
                key={m.key}
                className={`flex items-start gap-4 p-4 md:p-5 ${i < milestones.length - 1 ? "border-b-2 border-[#0a0a0a]" : ""} ${m.status === "active" ? "bg-[#fff7f2]" : ""}`}
              >
                <div className="shrink-0">
                  {m.status === "done" ? (
                    <div className="w-8 h-8 bg-[#10b981] border-2 border-[#0a0a0a] grid place-items-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : m.status === "active" ? (
                    <div className="w-8 h-8 bg-[#ff5722] border-2 border-[#0a0a0a] grid place-items-center animate-pulse">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-[#f5f2ea] border-2 border-[#0a0a0a] grid place-items-center">
                      <Circle className="w-4 h-4 text-[#0a0a0a]/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-black uppercase tracking-tight">{m.label}</div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border-2 border-[#0a0a0a] ${
                      m.status === "done" ? "bg-[#10b981] text-white" :
                      m.status === "active" ? "bg-[#ff5722] text-white" : "bg-[#f5f2ea]"
                    }`}>
                      {m.status === "done" ? "Erledigt" : m.status === "active" ? "In Arbeit" : "Ausstehend"}
                    </span>
                  </div>
                  <div className="text-xs text-[#0a0a0a]/70 mt-1">{m.desc}</div>
                </div>
                {m.status === "active" && (
                  <button
                    onClick={() => markDone(i)}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white hover:bg-[#ff5722] transition-colors"
                  >
                    Freigeben
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Grid: Updates + Files */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">/ Updates</h2>
            <div className="border-2 border-[#0a0a0a] bg-white p-5 space-y-3" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
              {updates.map((u, i) => (
                <div key={i} className="flex gap-3 pb-3 last:pb-0 border-b border-[#0a0a0a]/10 last:border-0">
                  <div className="w-8 shrink-0 text-[10px] font-black uppercase tracking-widest text-[#ff5722]">T-{u.day}</div>
                  <div className="text-sm flex-1">{u.text}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">/ Dokumente</h2>
            <div className="border-2 border-[#0a0a0a] bg-white" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
              {FILES.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 md:p-4 ${i < FILES.length - 1 ? "border-b-2 border-[#0a0a0a]/10" : ""} hover:bg-[#f5f2ea] group`}>
                  <div className="w-9 h-9 border-2 border-[#0a0a0a] grid place-items-center bg-[#f5f2ea] text-[9px] font-black">
                    {f.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm truncate">{f.name}</div>
                    <div className="text-[10px] text-[#0a0a0a]/50">{f.size}</div>
                  </div>
                  <button className="p-2 border-2 border-transparent hover:border-[#0a0a0a]" aria-label="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Chat */}
        <section className="mb-10">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">/ Direktkanal</h2>
          <div className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === "client" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] border-2 border-[#0a0a0a] p-3 ${m.from === "client" ? "bg-[#ff5722] text-white" : "bg-[#f5f2ea]"}`}>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">
                      {m.from === "client" ? "Du" : "KSE Team"} · {m.time}
                    </div>
                    <div className="text-sm">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMsg(); }}
                placeholder="Nachricht schreiben…"
                className="flex-1 border-2 border-[#0a0a0a] px-3 py-2 text-sm bg-[#f5f2ea] focus:outline-none focus:bg-white"
              />
              <button onClick={sendMsg} className="px-4 py-2 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ff5722] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Senden
              </button>
            </div>
          </div>
        </section>

        {/* Rating */}
        <section className="mb-10">
          <div className="border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white p-6 md:p-8" style={{ boxShadow: "8px 8px 0 0 #ff5722" }}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#ff5722] mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Feedback
            </div>
            <h3 className="font-black uppercase tracking-tight text-2xl md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
              Wie läuft die Mission?
            </h3>
            <p className="text-sm text-white/70 mt-1 mb-4">Dein Sterne-Rating hilft dem Team, den Kurs zu halten.</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} Sterne`}
                >
                  <Star
                    className={`w-8 h-8 transition-all ${
                      (hover || rating) >= n ? "fill-[#ff5722] text-[#ff5722]" : "text-white/40"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && <span className="ml-3 text-sm font-black uppercase tracking-widest text-[#ff5722]">Danke!</span>}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="grid md:grid-cols-3 gap-4">
          <FooterCard icon={Target} label="Nächstes Ziel" value={milestones.find(m => m.status === "active")?.label || "Launch"} />
          <FooterCard icon={FileText} label="Vertragsstand" value="Aktiv & bezahlt" />
          <FooterCard icon={Rocket} label="Support" value="24h Response-SLA" />
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50">
          <div>© KSE Group · Privates Portal für {client.name}</div>
          <a href="https://ksegroup.eu" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#ff5722]">
            ksegroup.eu <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </main>
  );
}

function FooterCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-4" style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-black text-lg mt-1">{value}</div>
    </div>
  );
}