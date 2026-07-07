import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Instagram,
  FileText,
  Video,
  Megaphone,
  Rocket,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin/planner")({
  component: PlannerPage,
});

// ---------- types ----------

type MissionType = "instagram" | "blog" | "video" | "kampagne" | "launch";
type MissionStatus = "entwurf" | "freigabe" | "geplant" | "live";

type Mission = {
  id: string;
  title: string;
  type: MissionType;
  status: MissionStatus;
  date: string; // YYYY-MM-DD
  notes?: string;
};

const TYPES: Record<
  MissionType,
  { label: string; icon: typeof Instagram; color: string }
> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#ff5722" },
  blog: { label: "Blog", icon: FileText, color: "#0a0a0a" },
  video: { label: "Video", icon: Video, color: "#7c3aed" },
  kampagne: { label: "Kampagne", icon: Megaphone, color: "#0ea5e9" },
  launch: { label: "Launch", icon: Rocket, color: "#16a34a" },
};

const STATUS: Record<MissionStatus, { label: string; bg: string; fg: string }> = {
  entwurf: { label: "Entwurf", bg: "#0a0a0a/10", fg: "#0a0a0a" },
  freigabe: { label: "Freigabe", bg: "#facc15", fg: "#0a0a0a" },
  geplant: { label: "Geplant", bg: "#0ea5e9", fg: "#ffffff" },
  live: { label: "LIVE", bg: "#16a34a", fg: "#ffffff" },
};

const STORAGE_KEY = "kse.planner.missions.v1";

// ---------- helpers ----------

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthMatrix(year: number, month: number) {
  // Monday-first
  const first = new Date(year, month, 1);
  const start = new Date(first);
  const offset = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - offset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function seedMissions(): Mission[] {
  const now = new Date();
  const iso = (offset: number) => {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    return toISO(d);
  };
  return [
    { id: "m1", title: "Reel: Behind the Build", type: "instagram", status: "freigabe", date: iso(1) },
    { id: "m2", title: "Blog: AI in KMU 2026", type: "blog", status: "entwurf", date: iso(3) },
    { id: "m3", title: "Kunde X — Landing Launch", type: "launch", status: "geplant", date: iso(5) },
    { id: "m4", title: "Kampagne Q4 Push", type: "kampagne", status: "geplant", date: iso(7) },
    { id: "m5", title: "YouTube: KSE Story", type: "video", status: "entwurf", date: iso(10) },
    { id: "m6", title: "Reel: Kunden-Stimme", type: "instagram", status: "live", date: iso(-1) },
  ];
}

// ---------- page ----------

function PlannerPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [missions, setMissions] = useState<Mission[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ date?: string; mission?: Mission } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMissions(JSON.parse(raw));
      else setMissions(seedMissions());
    } catch {
      setMissions(seedMissions());
    }
  }, []);

  useEffect(() => {
    if (missions.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  }, [missions]);

  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const byDate = useMemo(() => {
    const m = new Map<string, Mission[]>();
    for (const x of missions) {
      if (!m.has(x.date)) m.set(x.date, []);
      m.get(x.date)!.push(x);
    }
    return m;
  }, [missions]);

  const stats = useMemo(() => {
    const perStatus: Record<MissionStatus, number> = {
      entwurf: 0, freigabe: 0, geplant: 0, live: 0,
    };
    for (const m of missions) perStatus[m.status]++;
    return perStatus;
  }, [missions]);

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function saveMission(m: Mission) {
    setMissions((prev) => {
      const exists = prev.some((x) => x.id === m.id);
      return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
    });
    setEditor(null);
  }
  function deleteMission(id: string) {
    setMissions((prev) => prev.filter((x) => x.id !== id));
    setEditor(null);
  }

  function onDrop(dateISO: string) {
    if (!dragId) return;
    setMissions((prev) => prev.map((m) => (m.id === dragId ? { ...m, date: dateISO } : m)));
    setDragId(null);
    setOverDate(null);
  }

  const today = toISO(new Date());

  return (
    <div className="p-6 md:p-10 bg-[#f5f2ea] min-h-screen text-[#0a0a0a]">
      {/* header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-block bg-[#0a0a0a] text-[#ff5722] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            ◆ Missionsplaner
          </div>
          <h1
            className="font-black text-4xl md:text-5xl uppercase tracking-tighter leading-[0.9]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Content-<span className="text-[#ff5722]">Kalender</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#0a0a0a]/60 mt-2">
            Ziehe Missionen zwischen Tagen. Alles im Browser gespeichert.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-10 h-10 grid place-items-center border-2 border-[#0a0a0a] bg-white hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="border-2 border-[#0a0a0a] bg-white px-4 py-2 min-w-[220px] text-center"
            style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50">
              Monat
            </div>
            <div
              className="font-black text-xl uppercase tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {MONTHS[month]} {year}
            </div>
          </div>
          <button
            onClick={next}
            className="w-10 h-10 grid place-items-center border-2 border-[#0a0a0a] bg-white hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}
            aria-label="Nächster Monat"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditor({ date: toISO(new Date()) })}
            className="flex items-center gap-2 bg-[#ff5722] text-white px-4 h-10 border-2 border-[#0a0a0a] text-xs font-black uppercase tracking-widest hover:-translate-y-0.5 transition-transform"
            style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}
          >
            <Plus className="w-3.5 h-3.5" /> Mission
          </button>
        </div>
      </header>

      {/* status pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(STATUS) as MissionStatus[]).map((s) => (
          <div
            key={s}
            className="border-2 border-[#0a0a0a] bg-white px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            style={{ boxShadow: "2px 2px 0 0 #0a0a0a" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: STATUS[s].bg.includes("/") ? "#0a0a0a" : STATUS[s].bg }}
            />
            {STATUS[s].label}
            <span className="text-[#0a0a0a]/50 font-mono">{stats[s]}</span>
          </div>
        ))}
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50 px-2 py-1"
          >
            {w}
          </div>
        ))}
      </div>

      {/* calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === month;
          const isToday = iso === today;
          const items = byDate.get(iso) ?? [];
          const over = overDate === iso;
          return (
            <div
              key={i}
              onDragOver={(e) => { e.preventDefault(); setOverDate(iso); }}
              onDragLeave={() => setOverDate((v) => (v === iso ? null : v))}
              onDrop={() => onDrop(iso)}
              className={`min-h-[130px] border-2 border-[#0a0a0a] p-1.5 flex flex-col transition-all ${
                inMonth ? "bg-white" : "bg-[#0a0a0a]/[0.03]"
              } ${over ? "bg-[#ff5722]/10 border-dashed" : ""}`}
              style={{ boxShadow: inMonth ? "2px 2px 0 0 #0a0a0a" : undefined }}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={`text-[11px] font-black tabular-nums ${
                    isToday
                      ? "bg-[#ff5722] text-white px-1.5 py-0.5"
                      : inMonth
                      ? "text-[#0a0a0a]"
                      : "text-[#0a0a0a]/30"
                  }`}
                >
                  {d.getDate()}
                </div>
                <button
                  onClick={() => setEditor({ date: iso })}
                  className="opacity-0 hover:opacity-100 group-hover:opacity-100 text-[#0a0a0a]/40 hover:text-[#ff5722] transition-opacity"
                  aria-label="Mission hinzufügen"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 space-y-1 overflow-hidden">
                {items.map((m) => {
                  const t = TYPES[m.type];
                  const s = STATUS[m.status];
                  const Icon = t.icon;
                  return (
                    <button
                      key={m.id}
                      draggable
                      onDragStart={() => setDragId(m.id)}
                      onDragEnd={() => { setDragId(null); setOverDate(null); }}
                      onClick={() => setEditor({ mission: m })}
                      className={`w-full text-left border border-[#0a0a0a] p-1 flex items-center gap-1 text-[10px] font-bold hover:-translate-y-0.5 transition-transform ${
                        dragId === m.id ? "opacity-40" : ""
                      }`}
                      style={{ background: `${t.color}20` }}
                    >
                      <Icon className="w-3 h-3 shrink-0" style={{ color: t.color }} />
                      <span className="truncate flex-1">{m.title}</span>
                      <span
                        className="text-[8px] font-black uppercase tracking-widest px-1 shrink-0"
                        style={{
                          background: s.bg.includes("/") ? "transparent" : s.bg,
                          color: s.fg,
                          border: s.bg.includes("/") ? "1px solid #0a0a0a" : "none",
                        }}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* editor modal */}
      {editor && (
        <MissionEditor
          initial={editor.mission ?? {
            id: `m_${Date.now().toString(36)}`,
            title: "",
            type: "instagram",
            status: "entwurf",
            date: editor.date ?? toISO(new Date()),
          }}
          onClose={() => setEditor(null)}
          onSave={saveMission}
          onDelete={editor.mission ? () => deleteMission(editor.mission!.id) : undefined}
        />
      )}
    </div>
  );
}

function MissionEditor({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Mission;
  onClose: () => void;
  onSave: (m: Mission) => void;
  onDelete?: () => void;
}) {
  const [m, setM] = useState<Mission>(initial);
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a]/60 grid place-items-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#f5f2ea] border-2 border-[#0a0a0a] p-6"
        style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="inline-block bg-[#ff5722] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.3em] mb-1">
              Mission Briefing
            </div>
            <h3
              className="font-black text-2xl uppercase tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {onDelete ? "Bearbeiten" : "Neue Mission"}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#0a0a0a]/50 hover:text-[#ff5722]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 mb-1">
          Titel
        </label>
        <input
          value={m.title}
          onChange={(e) => setM({ ...m, title: e.target.value })}
          placeholder="z.B. Reel: Neuer Case Study"
          className="w-full bg-white border-2 border-[#0a0a0a] px-3 py-2 mb-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5722]"
        />

        <label className="block text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 mb-1">
          Datum
        </label>
        <input
          type="date"
          value={m.date}
          onChange={(e) => setM({ ...m, date: e.target.value })}
          className="w-full bg-white border-2 border-[#0a0a0a] px-3 py-2 mb-4 font-bold text-sm"
        />

        <label className="block text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 mb-1">
          Typ
        </label>
        <div className="grid grid-cols-5 gap-1 mb-4">
          {(Object.keys(TYPES) as MissionType[]).map((t) => {
            const Icon = TYPES[t].icon;
            const active = m.type === t;
            return (
              <button
                key={t}
                onClick={() => setM({ ...m, type: t })}
                className={`border-2 border-[#0a0a0a] p-2 text-[9px] font-black uppercase tracking-widest flex flex-col items-center gap-1 ${
                  active ? "bg-[#0a0a0a] text-white" : "bg-white"
                }`}
              >
                <Icon className="w-4 h-4" style={{ color: active ? TYPES[t].color : TYPES[t].color }} />
                {TYPES[t].label}
              </button>
            );
          })}
        </div>

        <label className="block text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 mb-1">
          Status
        </label>
        <div className="grid grid-cols-4 gap-1 mb-4">
          {(Object.keys(STATUS) as MissionStatus[]).map((s) => {
            const active = m.status === s;
            return (
              <button
                key={s}
                onClick={() => setM({ ...m, status: s })}
                className={`border-2 border-[#0a0a0a] p-2 text-[9px] font-black uppercase tracking-widest ${
                  active ? "bg-[#ff5722] text-white" : "bg-white"
                }`}
              >
                {STATUS[s].label}
              </button>
            );
          })}
        </div>

        <label className="block text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 mb-1">
          Notizen
        </label>
        <textarea
          value={m.notes ?? ""}
          onChange={(e) => setM({ ...m, notes: e.target.value })}
          rows={3}
          className="w-full bg-white border-2 border-[#0a0a0a] px-3 py-2 mb-5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#ff5722]"
          placeholder="Briefing, Links, Verantwortlicher…"
        />

        <div className="flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 hover:text-[#ff5722]"
            >
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-[#0a0a0a] bg-white text-[10px] font-black uppercase tracking-widest"
              style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}
            >
              Abbrechen
            </button>
            <button
              disabled={!m.title.trim()}
              onClick={() => onSave(m)}
              className="px-4 py-2 border-2 border-[#0a0a0a] bg-[#ff5722] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
              style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}