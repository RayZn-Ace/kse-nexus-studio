import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Flame, Star, Zap, Target, Shield, Award, Lock, CheckCircle2, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/admin/achievements")({
  head: () => ({ meta: [{ title: "Achievements — KSE Kommandozentrale" }, { name: "robots", content: "noindex" }] }),
  component: AchievementsPage,
});

type Stats = {
  streak: number;
  longestStreak: number;
  lastVisit: string | null;
  visits: number;
  missionsPlanned: number;
  leadsMoved: number;
  copilotRuns: number;
  reportsGenerated: number;
  spyChecks: number;
  xp: number;
};

const STORAGE = "kse_admin_stats_v1";

function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return { ...emptyStats(), ...JSON.parse(raw) };
  } catch {}
  return emptyStats();
}

function emptyStats(): Stats {
  return {
    streak: 0, longestStreak: 0, lastVisit: null, visits: 0,
    missionsPlanned: 0, leadsMoved: 0, copilotRuns: 0, reportsGenerated: 0,
    spyChecks: 0, xp: 0,
  };
}

function saveStats(s: Stats) {
  try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch {}
}

function today() { return new Date().toISOString().slice(0, 10); }
function yesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pulseVisit(prev: Stats): Stats {
  const t = today();
  if (prev.lastVisit === t) return prev;
  const nextStreak = prev.lastVisit === yesterday() ? prev.streak + 1 : 1;
  return {
    ...prev,
    lastVisit: t,
    streak: nextStreak,
    longestStreak: Math.max(prev.longestStreak, nextStreak),
    visits: prev.visits + 1,
    xp: prev.xp + 15,
  };
}

type Ach = {
  id: string;
  title: string;
  desc: string;
  icon: typeof Trophy;
  color: string;
  check: (s: Stats) => number; // 0..1
  reward: number;
};

const ACHIEVEMENTS: Ach[] = [
  { id: "first",   title: "Erster Zugriff",  desc: "Kommandozentrale betreten",       icon: Zap,    color: "#ff5722", check: s => s.visits >= 1 ? 1 : 0,                       reward: 50 },
  { id: "streak3", title: "Warm gelaufen",   desc: "3 Tage Streak",                    icon: Flame,  color: "#f59e0b", check: s => Math.min(1, s.streak / 3),                    reward: 100 },
  { id: "streak7", title: "Woche im Sattel", desc: "7 Tage Streak",                    icon: Flame,  color: "#dc2626", check: s => Math.min(1, s.streak / 7),                    reward: 250 },
  { id: "streak30",title: "Legendär",        desc: "30 Tage Streak",                   icon: Trophy, color: "#7c3aed", check: s => Math.min(1, s.streak / 30),                   reward: 1000 },
  { id: "visit10", title: "Regelmäßig",      desc: "10 Sessions",                       icon: Star,   color: "#0ea5e9", check: s => Math.min(1, s.visits / 10),                   reward: 120 },
  { id: "plan5",   title: "Missionsplaner",  desc: "5 Missionen im Planner",           icon: Target, color: "#10b981", check: s => Math.min(1, s.missionsPlanned / 5),           reward: 150 },
  { id: "lead10",  title: "Lead-Jäger",      desc: "10 Leads verschoben",              icon: Shield, color: "#ec4899", check: s => Math.min(1, s.leadsMoved / 10),               reward: 200 },
  { id: "copilot", title: "Copilot-Pilot",   desc: "5 Copilot-Runs",                    icon: Award,  color: "#3b82f6", check: s => Math.min(1, s.copilotRuns / 5),               reward: 150 },
  { id: "report",  title: "Dossier-Meister", desc: "3 Reports generiert",              icon: Award,  color: "#6366f1", check: s => Math.min(1, s.reportsGenerated / 3),          reward: 180 },
  { id: "spy",     title: "Beobachter",      desc: "5 Spy-Checks",                      icon: Star,   color: "#14b8a6", check: s => Math.min(1, s.spyChecks / 5),                 reward: 130 },
];

function level(xp: number) {
  // Level curve: 200, 500, 1000, 1800, 3000, ...
  const thresholds = [0, 200, 500, 1000, 1800, 3000, 4500, 6500, 9000, 12000];
  let lvl = 1;
  for (let i = 1; i < thresholds.length; i++) if (xp >= thresholds[i]) lvl = i + 1;
  const cur = thresholds[Math.min(lvl - 1, thresholds.length - 1)];
  const next = thresholds[Math.min(lvl, thresholds.length - 1)] || cur + 3000;
  return { lvl, cur, next, pct: Math.min(1, (xp - cur) / Math.max(1, next - cur)) };
}

function AchievementsPage() {
  const [stats, setStats] = useState<Stats>(emptyStats());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = pulseVisit(loadStats());
    saveStats(s);
    setStats(s);
    setMounted(true);
  }, []);

  const unlocked = useMemo(
    () => ACHIEVEMENTS.filter(a => a.check(stats) >= 1),
    [stats]
  );
  const totalXp = stats.xp + unlocked.reduce((sum, a) => sum + a.reward, 0);
  const lvl = level(totalXp);

  function bump(key: keyof Stats, amount = 1, xp = 20) {
    setStats(prev => {
      const next: Stats = { ...prev, [key]: (prev[key] as number) + amount, xp: prev.xp + xp };
      saveStats(next);
      return next;
    });
  }

  function reset() {
    if (!confirm("Wirklich alle Achievements & Streaks zurücksetzen?")) return;
    const empty = emptyStats();
    saveStats(empty);
    setStats(empty);
  }

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-block bg-[#0a0a0a] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] mb-3">
          ◆ Level {lvl.lvl} / Kommandant
        </div>
        <h1 className="font-black uppercase tracking-tighter leading-[0.9] text-5xl md:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
          Achievements
          <br />
          <span className="text-[#ff5722]">& Streaks.</span>
        </h1>
        <p className="mt-3 text-sm text-[#0a0a0a]/70 max-w-xl">
          Sammle XP, halte deine Streak am Leben und schalte alle Ehren der Kommandozentrale frei.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Aktuelle Streak" value={`${stats.streak} 🔥`} sub={`Rekord: ${stats.longestStreak}`} color="#ff5722" />
        <KpiCard label="Total XP" value={totalXp.toLocaleString("de-DE")} sub={`Level ${lvl.lvl}`} color="#0a0a0a" />
        <KpiCard label="Unlocked" value={`${unlocked.length}/${ACHIEVEMENTS.length}`} sub="Ehrenmedaillen" color="#10b981" />
        <KpiCard label="Sessions" value={stats.visits} sub="Zugriffe insgesamt" color="#3b82f6" />
      </div>

      {/* Level bar */}
      <div className="border-2 border-[#0a0a0a] bg-white p-4 mb-8" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
          <span>Level {lvl.lvl}</span>
          <span className="text-[#0a0a0a]/60">{totalXp - lvl.cur} / {lvl.next - lvl.cur} XP → LVL {lvl.lvl + 1}</span>
        </div>
        <div className="h-3 bg-[#f5f2ea] border-2 border-[#0a0a0a] overflow-hidden">
          <div className="h-full bg-[#ff5722] transition-all duration-500" style={{ width: `${lvl.pct * 100}%` }} />
        </div>
      </div>

      {/* Achievements grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">/ Ehrenmedaillen</h2>
          <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 hover:text-[#ff5722]">
            <RefreshCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map(a => {
            const pct = a.check(stats);
            const done = pct >= 1;
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                className={`relative border-2 border-[#0a0a0a] p-4 transition-all ${done ? "bg-white" : "bg-[#f5f2ea]"}`}
                style={{ boxShadow: done ? "6px 6px 0 0 #0a0a0a" : "3px 3px 0 0 #0a0a0a" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 grid place-items-center border-2 border-[#0a0a0a] shrink-0"
                    style={{ background: done ? a.color : "#e5e0d5" }}
                  >
                    {done ? <Icon className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-[#0a0a0a]/40" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-black uppercase text-sm truncate">{a.title}</div>
                      {done && <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />}
                    </div>
                    <div className="text-xs text-[#0a0a0a]/70 mt-0.5">{a.desc}</div>
                    <div className="mt-2 h-1.5 bg-[#f5f2ea] border border-[#0a0a0a]">
                      <div className="h-full transition-all" style={{ width: `${pct * 100}%`, background: a.color }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-[#0a0a0a]/50">{Math.round(pct * 100)}%</span>
                      <span style={{ color: done ? a.color : "#0a0a0a" }}>+{a.reward} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulate actions */}
      <div className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-3">/ Aktionen tracken</div>
        <p className="text-xs text-[#0a0a0a]/70 mb-4">
          Fürs Erste manuell — bald automatisch mit den anderen Modulen verdrahtet.
        </p>
        <div className="flex flex-wrap gap-2">
          <TrackBtn label="+1 Mission geplant" onClick={() => bump("missionsPlanned", 1, 30)} />
          <TrackBtn label="+1 Lead verschoben" onClick={() => bump("leadsMoved", 1, 25)} />
          <TrackBtn label="+1 Copilot-Run" onClick={() => bump("copilotRuns", 1, 40)} />
          <TrackBtn label="+1 Dossier" onClick={() => bump("reportsGenerated", 1, 60)} />
          <TrackBtn label="+1 Spy-Check" onClick={() => bump("spyChecks", 1, 20)} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-4" style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}>
      <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/60">{label}</div>
      <div className="mt-1 font-black text-3xl tabular-nums" style={{ fontFamily: "var(--font-display)", color }}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50 mt-1">{sub}</div>
    </div>
  );
}

function TrackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 border-2 border-[#0a0a0a] bg-[#f5f2ea] text-[11px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white transition-colors"
    >
      {label}
    </button>
  );
}