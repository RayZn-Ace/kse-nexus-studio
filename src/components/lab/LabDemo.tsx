import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Plus,
  Trash2,
  Play,
  Pause,
  Sparkles,
  Phone,
  Star,
  FileCode,
  Loader2,
  Check,
  Users,
  BrainCircuit,
  Zap,
  Eye,
  MousePointer2,
} from "lucide-react";

export function LabDemo({ id }: { id: string }) {
  switch (id) {
    case "nova":
      return <NovaDemo />;
    case "invoicer":
      return <InvoicerDemo />;
    case "voice":
      return <VoiceDemo />;
    case "reels":
      return <ReelsDemo />;
    case "shadow":
      return <ShadowDemo />;
    case "forge":
      return <ForgeDemo />;
    case "hive":
      return <HiveDemo />;
    case "atlas":
      return <AtlasDemo />;
    case "scribe":
      return <ScribeDemo />;
    default:
      return (
        <div className="border-2 border-white/20 p-6 text-center text-white/50 font-mono text-xs">
          Kein Testmodus verfügbar.
        </div>
      );
  }
}

/* -------------------- shared UI -------------------- */

function DemoFrame({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-2 border-white/25 bg-black">
      <div className="flex items-center justify-between border-b-2 border-white/25 px-3 py-2 font-mono text-[10px]">
        <span className="text-[#ffeb3b] tracking-widest">▶ {title}</span>
        {hint && <span className="text-white/40">{hint}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  color = "#ffeb3b",
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 border-2 transition-colors ${
        active
          ? "text-black border-transparent"
          : "border-white/25 text-white/70 hover:border-white/60 hover:text-white"
      }`}
      style={active ? { background: color, borderColor: color } : undefined}
    >
      {children}
    </button>
  );
}

/* -------------------- NOVA (chat) -------------------- */

const NOVA_REPLIES: Record<string, string> = {
  preise:
    "Websites starten bei 4.9k € (Onepager), Apps ab 12k €, AI-Agents ab 2.5k €/Monat. Willst du ein konkretes Setup skizzieren?",
  ai: "Wir bauen AI-Agents für Web, Telefon, Support & interne Prozesse. Konkret: NOVA, VOX und HIVE — willst du eines davon live sehen?",
  team: "6 Leute in Hannover: Software, AI, Web, Marketing, Branding. Kein Outsourcing, keine Freelancer-Kette.",
  kontakt: "hallo@ksegroup.eu · +49 511 XXX · oder WhatsApp rechts unten. 15 Min Call reicht meist.",
  default: "Kurze Antwort: ja. Lange Antwort: schreib mir was du bauen willst, ich sortiere es in 2 Sätzen.",
};

function NovaDemo() {
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hey — NOVA hier. Frag mich was zur KSE Group." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ top: 9999, behavior: "smooth" });
  }, [msgs, typing]);

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const key = Object.keys(NOVA_REPLIES).find((k) => q.toLowerCase().includes(k));
      setMsgs((m) => [...m, { role: "bot", text: NOVA_REPLIES[key ?? "default"] }]);
      setTyping(false);
    }, 700);
  };

  return (
    <DemoFrame title="NOVA · CONCIERGE CHAT" hint="mock — echte Version rechts unten">
      <div ref={scroll} className="h-64 overflow-y-auto space-y-2 pr-1">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] text-xs px-3 py-2 leading-relaxed ${
                m.role === "user"
                  ? "bg-[#ffeb3b] text-black"
                  : "bg-white/5 text-white border border-white/15"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="text-xs text-white/40 font-mono">NOVA tippt<span className="animate-pulse">…</span></div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Preise", "AI", "Team", "Kontakt"].map((q) => (
          <Chip key={q} onClick={() => send(q.toLowerCase())}>
            {q}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Frag was…"
          className="flex-1 bg-black border-2 border-white/25 px-3 py-2 text-xs outline-none focus:border-[#ffeb3b] text-white placeholder:text-white/30 font-mono"
        />
        <button
          onClick={() => send(input)}
          className="border-2 border-[#ffeb3b] bg-[#ffeb3b] text-black px-3 hover:bg-transparent hover:text-[#ffeb3b] transition-colors"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </DemoFrame>
  );
}

/* -------------------- INVOICER -------------------- */

type Line = { id: number; desc: string; qty: number; price: number };

function InvoicerDemo() {
  const [lines, setLines] = useState<Line[]>([
    { id: 1, desc: "Montage Küchenzeile", qty: 8, price: 68 },
    { id: 2, desc: "Anfahrt Wolfsburg → Hannover", qty: 1, price: 90 },
  ]);
  const [customer, setCustomer] = useState("Müller GmbH");

  const net = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const vat = net * 0.19;
  const total = net + vat;

  const update = (id: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <DemoFrame title="INVOICER · POSITIONEN" hint="live-kalkulation">
      <div className="space-y-3">
        <div>
          <label className="font-mono text-[10px] text-white/40 uppercase">Kunde</label>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="mt-1 w-full bg-black border-2 border-white/25 px-3 py-2 text-xs outline-none focus:border-[#ff5722] text-white font-mono"
          />
        </div>
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="grid grid-cols-[1fr_60px_80px_28px] gap-2 items-center">
              <input
                value={l.desc}
                onChange={(e) => update(l.id, { desc: e.target.value })}
                className="bg-black border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-[#ff5722] text-white font-mono"
              />
              <input
                type="number"
                value={l.qty}
                onChange={(e) => update(l.id, { qty: +e.target.value })}
                className="bg-black border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-[#ff5722] text-white text-right font-mono"
              />
              <input
                type="number"
                value={l.price}
                onChange={(e) => update(l.id, { price: +e.target.value })}
                className="bg-black border border-white/20 px-2 py-1.5 text-xs outline-none focus:border-[#ff5722] text-white text-right font-mono"
              />
              <button
                onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                className="text-white/40 hover:text-[#ff5722]"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setLines((ls) => [
                ...ls,
                { id: Date.now(), desc: "Neue Position", qty: 1, price: 0 },
              ])
            }
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#ff5722] hover:text-white"
          >
            <Plus className="w-3 h-3" /> Position hinzufügen
          </button>
        </div>
        <div className="border-t-2 border-white/20 pt-3 font-mono text-xs space-y-1">
          <Row label="Netto" value={net} />
          <Row label="USt 19%" value={vat} />
          <div className="flex justify-between pt-1 border-t border-white/10">
            <span className="text-white/60">TOTAL</span>
            <span className="text-[#ff5722] font-bold text-base">
              {total.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white">
        {value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
      </span>
    </div>
  );
}

/* -------------------- VOICE -------------------- */

const CALL_SCRIPT: { who: "AI" | "USER"; text: string; ms: number }[] = [
  { who: "AI", text: "KSE Group, hier ist Nova. Wie kann ich helfen?", ms: 1600 },
  { who: "USER", text: "Ich hätte gern einen Termin nächste Woche.", ms: 1500 },
  { who: "AI", text: "Klar — Dienstag 10:00 oder Donnerstag 14:00?", ms: 1600 },
  { who: "USER", text: "Donnerstag passt.", ms: 900 },
  { who: "AI", text: "Perfekt. Auf welche Nummer schicke ich die Bestätigung?", ms: 1600 },
  { who: "USER", text: "0511 123 456.", ms: 900 },
  { who: "AI", text: "Danke — ist im Kalender. Bis Donnerstag!", ms: 1500 },
];

function VoiceDemo() {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (step >= CALL_SCRIPT.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), CALL_SCRIPT[step].ms);
    return () => clearTimeout(t);
  }, [playing, step]);

  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  return (
    <DemoFrame title="VOX · CALL SIMULATION" hint="simuliert · keine echte Line">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            if (step >= CALL_SCRIPT.length) reset();
            setPlaying((p) => !p);
          }}
          className="grid place-items-center h-10 w-10 border-2 border-[#00e5ff] bg-[#00e5ff] text-black hover:bg-transparent hover:text-[#00e5ff] transition-colors"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex-1 flex items-end gap-0.5 h-10">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: playing ? [4, 8 + ((i * 7) % 24), 4] : 3,
              }}
              transition={{
                duration: 0.6 + (i % 5) * 0.08,
                repeat: playing ? Infinity : 0,
                delay: i * 0.03,
              }}
              className="flex-1 bg-[#00e5ff]"
            />
          ))}
        </div>
        <div className="font-mono text-[10px] text-white/50">
          <Phone className="inline w-3 h-3 mr-1" />
          {String(Math.floor(step / 2)).padStart(2, "0")}:
          {String((step * 6) % 60).padStart(2, "0")}
        </div>
      </div>
      <div className="h-56 overflow-y-auto space-y-2 font-mono text-xs pr-1">
        {CALL_SCRIPT.slice(0, step).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <span
              className={
                l.who === "AI" ? "text-[#00e5ff] shrink-0" : "text-[#ffeb3b] shrink-0"
              }
            >
              [{l.who}]
            </span>
            <span className="text-white/80">{l.text}</span>
          </motion.div>
        ))}
        {!playing && step === 0 && (
          <div className="text-white/40">▶ Play drücken — Anruf beginnt.</div>
        )}
        {step >= CALL_SCRIPT.length && (
          <div className="mt-2 text-[#10b981]">✓ Termin gebucht · Do 14:00 · SMS gesendet</div>
        )}
      </div>
    </DemoFrame>
  );
}

/* -------------------- REELS PIPELINE -------------------- */

const REEL_STEPS = [
  "prompt → storyboard (4 shots)",
  "video-gen · shot 1/4 · 12s",
  "video-gen · shot 2/4 · 11s",
  "video-gen · shot 3/4 · 14s",
  "video-gen · shot 4/4 · 10s",
  "voice-over · elevenlabs · de-DE",
  "cut & sync · ffmpeg",
  "music · epidemic · matched bpm 128",
  "auto-post → instagram · scheduled",
];

function ReelsDemo() {
  const [prompt, setPrompt] = useState("Handwerker montiert Küche in Wolfsburg — cinematic, warm light");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (step >= REEL_STEPS.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 550);
    return () => clearTimeout(t);
  }, [running, step]);

  const start = () => {
    setStep(0);
    setRunning(true);
  };

  return (
    <DemoFrame title="REEL PIPELINE" hint="dry-run">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        className="w-full bg-black border-2 border-white/25 p-2 text-xs outline-none focus:border-[#ffeb3b] text-white font-mono resize-none"
      />
      <button
        onClick={start}
        disabled={running}
        className="mt-2 inline-flex items-center gap-1.5 border-2 border-[#ffeb3b] bg-[#ffeb3b] text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#ffeb3b] transition-colors disabled:opacity-50"
      >
        <Zap className="w-3.5 h-3.5" /> {running ? "rendering…" : "Reel bauen"}
      </button>
      <div className="mt-4 space-y-1.5 font-mono text-xs">
        {REEL_STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step && running;
          return (
            <div
              key={s}
              className={`flex items-center gap-2 ${done ? "text-[#10b981]" : current ? "text-[#ffeb3b]" : "text-white/30"}`}
            >
              {done ? (
                <Check className="w-3 h-3" />
              ) : current ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="w-3 h-3 border border-white/30" />
              )}
              <span>{s}</span>
            </div>
          );
        })}
      </div>
      {step >= REEL_STEPS.length && !running && (
        <div className="mt-4 border-2 border-[#10b981] p-3 text-[#10b981] font-mono text-xs">
          ✓ reel_wolfsburg_montage.mp4 · 14s · 8.2mb · queued for 18:00
        </div>
      )}
    </DemoFrame>
  );
}

/* -------------------- SHADOW ANALYTICS -------------------- */

function ShadowDemo() {
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [clicks, setClicks] = useState<{ x: number; y: number; id: number }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    setPointer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };
  const click = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    setClicks((c) => [
      ...c,
      {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        id: Date.now(),
      },
    ]);
  };

  const summary = useMemo(() => {
    if (clicks.length === 0) return "Warte auf Interaktion…";
    const zones = { top: 0, mid: 0, bot: 0 };
    clicks.forEach((c) => {
      if (c.y < 33) zones.top++;
      else if (c.y < 66) zones.mid++;
      else zones.bot++;
    });
    const dom = Object.entries(zones).sort((a, b) => b[1] - a[1])[0][0];
    const map = { top: "Hero / Nav", mid: "Content-Mitte", bot: "CTA / Footer" };
    return `${clicks.length} Klicks · Fokus auf ${map[dom as keyof typeof map]} · Consent: none required`;
  }, [clicks]);

  return (
    <DemoFrame title="SHADOW · SESSION MOCK" hint="beweg die Maus, klick rein">
      <div
        ref={ref}
        onMouseMove={move}
        onClick={click}
        className="relative h-56 border-2 border-white/25 bg-[#0f0f14] overflow-hidden cursor-crosshair"
      >
        {/* fake page */}
        <div className="absolute inset-x-4 top-3 h-4 bg-white/10" />
        <div className="absolute left-4 top-10 h-16 w-2/3 bg-white/15" />
        <div className="absolute left-4 top-28 h-3 w-1/2 bg-white/10" />
        <div className="absolute left-4 top-34 h-3 w-1/3 bg-white/10" />
        <div className="absolute right-4 bottom-4 h-8 w-24 bg-[#c084fc]/60" />

        {/* click heatmap */}
        {clicks.map((c) => (
          <motion.div
            key={c.id}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute w-6 h-6 rounded-full bg-[#c084fc] pointer-events-none"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}
          />
        ))}
        {/* live cursor */}
        <div
          className="absolute pointer-events-none"
          style={{ left: `${pointer.x}%`, top: `${pointer.y}%`, transform: "translate(-6px, -4px)" }}
        >
          <MousePointer2 className="w-4 h-4 text-[#c084fc] fill-[#c084fc]" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-xs">
        <Eye className="w-3.5 h-3.5 text-[#c084fc]" />
        <span className="text-white/70">{summary}</span>
      </div>
      {clicks.length > 0 && (
        <button
          onClick={() => setClicks([])}
          className="mt-2 text-[10px] font-mono text-white/40 hover:text-white"
        >
          reset session
        </button>
      )}
    </DemoFrame>
  );
}

/* -------------------- BRAND FORGE -------------------- */

const PALETTES: Record<string, { bg: string; ink: string; accent: string; flash: string; type: string }> = {
  minimal: { bg: "#fafafa", ink: "#0a0a0a", accent: "#3b3b3b", flash: "#ff5722", type: "Inter · Söhne" },
  bold: { bg: "#0a0a0a", ink: "#ffffff", accent: "#ffeb3b", flash: "#ff5722", type: "Space Grotesk · DM Sans" },
  editorial: { bg: "#f5f0e8", ink: "#1a1a1a", accent: "#8b6f4e", flash: "#c44a3a", type: "Cormorant · Karla" },
  future: { bg: "#0d1b2a", ink: "#e0f2fe", accent: "#22d3ee", flash: "#f472b6", type: "Sora · Manrope" },
};

function ForgeDemo() {
  const [name, setName] = useState("Kompakt Holz");
  const [vibe, setVibe] = useState<keyof typeof PALETTES>("bold");
  const p = PALETTES[vibe];

  return (
    <DemoFrame title="BRAND FORGE" hint="live-preview">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] text-white/40 uppercase">Brand Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-black border-2 border-white/25 px-3 py-2 text-xs outline-none focus:border-[#f472b6] text-white font-mono"
          />
          <div className="mt-3 font-mono text-[10px] text-white/40 uppercase">Vibe</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((k) => (
              <Chip key={k} active={vibe === k} onClick={() => setVibe(k)} color="#f472b6">
                {k}
              </Chip>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1">
            {[p.bg, p.ink, p.accent, p.flash].map((c) => (
              <div key={c} className="aspect-square border border-white/25" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-2 font-mono text-[10px] text-white/50">{p.type}</div>
        </div>

        {/* preview card */}
        <motion.div
          key={vibe + name}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-2 p-4 flex flex-col justify-between min-h-[220px]"
          style={{ background: p.bg, color: p.ink, borderColor: p.ink }}
        >
          <div className="flex items-center justify-between text-[10px] font-mono opacity-60">
            <span>V0.1</span>
            <span>{new Date().getFullYear()}</span>
          </div>
          <div>
            <div className="text-[10px] font-mono" style={{ color: p.accent }}>
              — brand system
            </div>
            <div
              className="font-black uppercase leading-[0.9] tracking-tight text-3xl mt-1"
              style={{ color: p.ink }}
            >
              {name || "Untitled"}
              <span style={{ color: p.flash }}>.</span>
            </div>
            <div className="text-[11px] mt-2 opacity-70">
              made with intent — {vibe}.
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="text-[10px] font-mono px-2 py-1"
              style={{ background: p.flash, color: p.bg }}
            >
              CTA →
            </button>
            <button
              className="text-[10px] font-mono px-2 py-1 border"
              style={{ borderColor: p.ink, color: p.ink }}
            >
              secondary
            </button>
          </div>
        </motion.div>
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-white/40">
        <Sparkles className="w-3 h-3 text-[#f472b6]" />
        Export würde CSS-Tokens, JSON & Figma-Sync erzeugen.
      </div>
    </DemoFrame>
  );
}

/* -------------------- HIVE SWARM -------------------- */

const HIVE_JOBS: Record<string, { agent: string; color: string; text: string; ms: number }[]> = {
  blogpost: [
    { agent: "RESEARCH", color: "#22d3ee", text: "scraping 12 sources on 'ai in trades'…", ms: 700 },
    { agent: "RESEARCH", color: "#22d3ee", text: "→ 4 relevant angles extracted", ms: 500 },
    { agent: "WRITER", color: "#ffeb3b", text: "drafting outline · 6 sections", ms: 700 },
    { agent: "WRITER", color: "#ffeb3b", text: "prose draft · 720 words", ms: 900 },
    { agent: "REVIEWER", color: "#ff5722", text: "tone check · claims flagged: 1", ms: 700 },
    { agent: "WRITER", color: "#ffeb3b", text: "revision applied · 705 words", ms: 700 },
    { agent: "PUBLISHER", color: "#10b981", text: "seo meta + og image generated", ms: 700 },
    { agent: "PUBLISHER", color: "#10b981", text: "✓ published /blog/ai-in-trades", ms: 500 },
  ],
  outreach: [
    { agent: "RESEARCH", color: "#22d3ee", text: "loading 40 GMB leads · Wolfsburg", ms: 700 },
    { agent: "REVIEWER", color: "#ff5722", text: "filter: <4.5★ or no website → 14", ms: 700 },
    { agent: "WRITER", color: "#ffeb3b", text: "personalising 14 emails…", ms: 900 },
    { agent: "PUBLISHER", color: "#10b981", text: "queued in postmark · send 09:00", ms: 700 },
    { agent: "PUBLISHER", color: "#10b981", text: "✓ 14 mails scheduled", ms: 500 },
  ],
  audit: [
    { agent: "RESEARCH", color: "#22d3ee", text: "crawling ksegroup.eu · 41 urls", ms: 800 },
    { agent: "REVIEWER", color: "#ff5722", text: "flags: 3 slow LCP, 2 alt-text missing", ms: 800 },
    { agent: "WRITER", color: "#ffeb3b", text: "writing fix-list · 12 actions", ms: 700 },
    { agent: "PUBLISHER", color: "#10b981", text: "✓ report saved · 12 actions", ms: 500 },
  ],
};

function HiveDemo() {
  const [job, setJob] = useState<keyof typeof HIVE_JOBS>("blogpost");
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const steps = HIVE_JOBS[job];

  useEffect(() => {
    if (!running) return;
    if (step >= steps.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), steps[step].ms);
    return () => clearTimeout(t);
  }, [running, step, steps]);

  const run = () => {
    setStep(0);
    setRunning(true);
  };

  return (
    <DemoFrame title="HIVE · SWARM ORCHESTRATOR" hint="4 agents · sequenziert">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] text-white/40 mr-1">JOB:</span>
        {(Object.keys(HIVE_JOBS) as (keyof typeof HIVE_JOBS)[]).map((k) => (
          <Chip
            key={k}
            active={job === k}
            color="#22d3ee"
            onClick={() => {
              setJob(k);
              setStep(0);
              setRunning(false);
            }}
          >
            {k}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {["RESEARCH", "WRITER", "REVIEWER", "PUBLISHER"].map((a) => {
          const active = running && steps[step - 1]?.agent === a;
          return (
            <div
              key={a}
              className={`border-2 p-2 font-mono text-[9px] text-center transition-colors ${
                active ? "border-[#22d3ee] text-[#22d3ee] bg-[#22d3ee]/10" : "border-white/20 text-white/50"
              }`}
            >
              <BrainCircuit className="w-3 h-3 inline mr-0.5" /> {a}
            </div>
          );
        })}
      </div>
      <div className="h-40 overflow-y-auto space-y-1 font-mono text-xs pr-1 border-2 border-white/15 p-2 bg-black">
        {steps.slice(0, step).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span className="shrink-0 font-bold" style={{ color: s.color }}>
              [{s.agent}]
            </span>
            <span className="text-white/70">{s.text}</span>
          </motion.div>
        ))}
        {running && step < steps.length && (
          <div className="text-white/40 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> working…
          </div>
        )}
        {!running && step === 0 && <div className="text-white/40">▶ Run drücken.</div>}
      </div>
      <button
        onClick={run}
        disabled={running}
        className="mt-3 inline-flex items-center gap-1.5 border-2 border-[#22d3ee] bg-[#22d3ee] text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#22d3ee] transition-colors disabled:opacity-50"
      >
        <Users className="w-3.5 h-3.5" /> {running ? "swarming…" : "Swarm starten"}
      </button>
    </DemoFrame>
  );
}

/* -------------------- ATLAS · Review Reply -------------------- */

const REVIEWS = [
  {
    stars: 5,
    author: "Sabine K.",
    text: "Super Team, alles pünktlich und sauber gemacht. Klare Empfehlung!",
    reply: "Danke Sabine — freut uns riesig, dass alles gepasst hat. Bis zum nächsten Projekt!",
  },
  {
    stars: 2,
    author: "Markus H.",
    text: "Termin verschoben, Kommunikation ausbaufähig.",
    reply:
      "Hi Markus, danke für das ehrliche Feedback. Der verschobene Termin lag an einem Lieferengpass — wir haben die Kommunikation bereits nachgeschärft. Melde dich gern direkt: hallo@ksegroup.eu.",
  },
  {
    stars: 5,
    author: "Jonas W.",
    text: "Website & Rechnungstool sind ein Gamechanger für uns.",
    reply: "Danke Jonas — genau dafür bauen wir das Zeug. Grüße nach Wolfsburg!",
  },
];

function AtlasDemo() {
  const [idx, setIdx] = useState(0);
  const [showReply, setShowReply] = useState(false);
  const r = REVIEWS[idx];

  const next = () => {
    setIdx((i) => (i + 1) % REVIEWS.length);
    setShowReply(false);
  };

  return (
    <DemoFrame title="ATLAS · REVIEW AUTOPILOT" hint="generierte Antwort">
      <div className="border-2 border-white/20 p-3 bg-black">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < r.stars ? "fill-[#ffeb3b] text-[#ffeb3b]" : "text-white/20"}`}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-white/50">{r.author}</span>
        </div>
        <p className="text-xs text-white/80 leading-relaxed">"{r.text}"</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setShowReply(true)}
          disabled={showReply}
          className="inline-flex items-center gap-1.5 border-2 border-[#10b981] bg-[#10b981] text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#10b981] transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" /> Antwort generieren
        </button>
        <button
          onClick={next}
          className="border-2 border-white/25 text-white/70 px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:border-white hover:text-white transition-colors"
        >
          nächstes Review
        </button>
      </div>
      <AnimatePresence>
        {showReply && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 border-l-2 border-[#10b981] pl-3 py-1"
          >
            <div className="font-mono text-[10px] text-[#10b981] mb-1">KSE GROUP · Owner Reply</div>
            <p className="text-xs text-white/85 leading-relaxed">{r.reply}</p>
            <div className="mt-2 font-mono text-[10px] text-white/40">
              tone: freundlich · claim-safe · &lt; 2h response time
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoFrame>
  );
}

/* -------------------- SCRIBE · Doc-to-App -------------------- */

function ScribeDemo() {
  const [text, setText] = useState(
    "Formular: Auftragsanfrage · Felder: Kunde (Name, Email, Tel), Objekt (Adresse, Etage, Fläche m²), Leistung (Küche | Bad | Türen | Sonstiges), Zeitraum (von/bis). Preis = Fläche × 12 €/m² + Anfahrt 45 €.",
  );
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    "parsing PDF/text · entities extracted",
    "inferring schema · 3 tables detected",
    "generating Zod validators",
    "scaffolding TanStack routes",
    "wiring Supabase · RLS enabled",
    "compiling formula: fläche × 12 + 45",
    "✓ app ready · deploy preview",
  ];

  useEffect(() => {
    if (!running) return;
    if (step >= steps.length) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 500);
    return () => clearTimeout(t);
  }, [running, step]);

  const compile = () => {
    setStep(0);
    setRunning(true);
  };

  return (
    <DemoFrame title="SCRIBE · DOC → APP" hint="Prototyp · nicht wirklich deploybar">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full bg-black border-2 border-white/25 p-2 text-xs outline-none focus:border-[#fb923c] text-white font-mono resize-none"
      />
      <button
        onClick={compile}
        disabled={running}
        className="mt-2 inline-flex items-center gap-1.5 border-2 border-[#fb923c] bg-[#fb923c] text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-transparent hover:text-[#fb923c] transition-colors disabled:opacity-50"
      >
        <FileCode className="w-3.5 h-3.5" /> {running ? "compiling…" : "App bauen"}
      </button>
      <div className="mt-3 space-y-1 font-mono text-xs">
        {steps.slice(0, step).map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-[#10b981]">
            <Check className="w-3 h-3" /> <span>{s}</span>
          </div>
        ))}
        {running && step < steps.length && (
          <div className="flex items-center gap-2 text-[#fb923c]">
            <Loader2 className="w-3 h-3 animate-spin" /> {steps[step]}
          </div>
        )}
      </div>
      {step >= steps.length && !running && (
        <div className="mt-3 border-2 border-[#fb923c] p-3 font-mono text-xs">
          <div className="text-[#fb923c]">✓ preview.scribe.kse.dev/anfrage</div>
          <div className="text-white/50 mt-1">tables: 3 · routes: 4 · loc: ~1420</div>
        </div>
      )}
    </DemoFrame>
  );
}