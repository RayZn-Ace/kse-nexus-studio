import { useEffect, useRef, useState, useCallback } from "react";
import { X, Lock, Play, Infinity as InfinityIcon, Loader2, Trophy } from "lucide-react";
import {
  LEVELS,
  ENDLESS_LEVEL,
  VILLAINS,
  PROLOGUE,
  EPILOGUE,
  type Level,
  type VillainKind,
} from "@/lib/game/levels";
import {
  loadProgress,
  saveProgress,
  loadLeaderboard,
  EMPTY_PROGRESS,
  getPlayerKey,
  type GameProgress,
  type LeaderboardEntry,
} from "@/lib/game/progress";

function Leaderboard({
  mode,
  refreshKey,
  compact = false,
}: {
  mode: "best" | "endless";
  refreshKey: number;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [tab, setTab] = useState<"best" | "endless">(mode);
  const me = typeof window !== "undefined" ? getPlayerKey() : "";

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    loadLeaderboard(tab, compact ? 5 : 10)
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, [tab, refreshKey, compact]);

  return (
    <div className="border-2 border-white/15 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
          Highscores
        </span>
        <div className="ml-auto flex gap-1">
          {(["best", "endless"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                tab === t ? "bg-orange-500 text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {t === "best" ? "Story" : "Endlos"}
            </button>
          ))}
        </div>
      </div>
      {rows === null ? (
        <div className="text-white/40 text-[11px] flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Lade Rangliste…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-white/40 text-[11px]">Noch keine Einträge — sei der Erste!</div>
      ) : (
        <ol className="space-y-1">
          {rows.map((r, i) => (
            <li
              key={r.player_key}
              className={`flex items-center gap-2 text-[12px] ${
                r.player_key === me ? "text-orange-300 font-bold" : "text-white/70"
              }`}
            >
              <span className="w-5 tabular-nums text-white/40">{i + 1}.</span>
              <span className="truncate flex-1">
                {r.display_name?.trim() || "Anonymer Held"}
                {r.player_key === me && " (du)"}
              </span>
              <span className="tabular-nums font-mono text-orange-400">
                {tab === "endless" ? r.endless_best : r.best_score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

type Villain = {
  id: number;
  kind: VillainKind;
  x: number;
  y: number;
  vx: number;
  hp: number;
  maxHp: number;
  hit: boolean;
  flash: number;
  wobble: number;
};
type Web = { id: number; x: number; y: number; targetX: number; targetY: number; t: number };
type Screen = "menu" | "story" | "play" | "cleared" | "over";

const GAME_W = 720;
const GAME_H = 480;

export function SpideyGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [kills, setKills] = useState(0);
  const [screen, setScreen] = useState<Screen>("menu");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [boardKey, setBoardKey] = useState(0);
  const [levelIndex, setLevelIndex] = useState(0);
  const [endless, setEndless] = useState(false);
  const [speedInfo, setSpeedInfo] = useState(1);
  const [beat, setBeat] = useState<{ who: string; text: string } | null>(null);

  const level: Level = endless ? ENDLESS_LEVEL : LEVELS[levelIndex];

  const stateRef = useRef({
    villains: [] as Villain[],
    webs: [] as Web[],
    spawnTimer: 0,
    tick: 0,
    score: 0,
    lives: 3,
    kills: 0,
    running: false,
    ramp: 1,
    bossSpawned: false,
    level: LEVELS[0] as Level,
    endless: false,
    aim: { x: GAME_W / 2, y: GAME_H / 2, active: false },
    firing: false,
    cooldown: 0,
    beatsDone: new Set<number>(),
    spidey: { x: GAME_W - 90, y: 220, swing: 0 },
    idCounter: 1,
  });

  // load server progress
  useEffect(() => {
    let cancelled = false;
    loadProgress()
      .then((p) => {
        if (cancelled) return;
        setProgress(p);
        setLevelIndex(Math.min(LEVELS.length - 1, Math.max(0, (p.level || 1) - 1)));
      })
      .catch(() => void 0)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((patch: Partial<GameProgress>) => {
    setProgress((prev) => {
      const next = { ...prev, ...patch };
      void saveProgress(next);
      return next;
    });
  }, []);

  const startLevel = useCallback((index: number, isEndless: boolean) => {
    const lvl = isEndless ? ENDLESS_LEVEL : LEVELS[index];
    const s = stateRef.current;
    s.villains = [];
    s.webs = [];
    s.spawnTimer = 30;
    s.score = 0;
    s.kills = 0;
    s.lives = lvl.lives;
    s.ramp = 1;
    s.bossSpawned = false;
    s.level = lvl;
    s.endless = isEndless;
    s.running = true;
    s.firing = false;
    s.cooldown = 0;
    s.beatsDone = new Set<number>();
    setScore(0);
    setKills(0);
    setLives(lvl.lives);
    setSpeedInfo(1);
    setBeat(null);
    setEndless(isEndless);
    setLevelIndex(index);
    setScreen("play");
  }, []);

  const toGame = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * GAME_W) / rect.width,
      y: ((clientY - rect.top) * GAME_H) / rect.height,
    };
  }, []);

  const shootAt = useCallback((tx: number, ty: number) => {
    const s = stateRef.current;
    if (!s.running) return;
    s.webs.push({
      id: s.idCounter++,
      x: s.spidey.x,
      y: s.spidey.y,
      targetX: tx,
      targetY: ty,
      t: 0,
    });
    // hit detection — nearest villain within its radius (+ tolerance)
    let best: Villain | null = null;
    let bestD = Infinity;
    for (const v of s.villains) {
      if (v.hit) continue;
      const d = Math.hypot(v.x - tx, v.y - ty);
      if (d < VILLAINS[v.kind].radius + 30 && d < bestD) {
        best = v;
        bestD = d;
      }
    }
    if (!best) return;
    best.hp -= 1;
    best.flash = 8;
    if (best.hp <= 0) {
      best.hit = true;
      s.score += VILLAINS[best.kind].points;
      s.kills += 1;
      setScore(s.score);
      setKills(s.kills);
    } else {
      s.score += 2;
      setScore(s.score);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const s = stateRef.current;

    const drawBuilding = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,220,120,0.55)";
      for (let iy = y + 14; iy < y + h - 8; iy += 22) {
        for (let ix = x + 8; ix < x + w - 8; ix += 18) {
          if ((ix + iy + s.tick / 40) % 3 < 1) ctx.fillRect(ix, iy, 8, 10);
          else {
            ctx.fillStyle = "rgba(255,220,120,0.15)";
            ctx.fillRect(ix, iy, 8, 10);
            ctx.fillStyle = "rgba(255,220,120,0.55)";
          }
        }
      }
    };

    const drawSpidey = (x: number, y: number, swing: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(swing) * 0.15);
      // web from top
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -y);
      ctx.lineTo(0, -30);
      ctx.stroke();
      // body
      ctx.fillStyle = "#e11d1d";
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      // mask lower
      ctx.fillStyle = "#1e3a8a";
      ctx.beginPath();
      ctx.arc(0, 8, 16, 0, Math.PI);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-7, -4, 5, 7, -0.3, 0, Math.PI * 2);
      ctx.ellipse(7, -4, 5, 7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // web pattern
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 0.8;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(i * 6, 22);
        ctx.stroke();
      }
      for (let r = 6; r < 22; r += 6) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawVillain = (v: Villain) => {
      const spec = VILLAINS[v.kind];
      ctx.save();
      ctx.translate(v.x, v.y + Math.sin(v.wobble) * 4);
      if (v.hit) {
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 28px system-ui";
        ctx.fillText("POW!", -22, 0);
        ctx.restore();
        return;
      }
      const r = spec.radius;
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = v.flash > 0 ? "#ffffff" : spec.color;
      ctx.beginPath();
      ctx.arc(0, -2, r - 4, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(-r * 0.24, -r * 0.12, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.24, -r * 0.12, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      // grin
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, r * 0.16, r * 0.32, 0, Math.PI);
      ctx.stroke();
      // hp bar for multi-hit enemies
      if (v.maxHp > 1) {
        const w = r * 2;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(-r, -r - 14, w, 6);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-r, -r - 14, (w * Math.max(0, v.hp)) / v.maxHp, 6);
      }
      ctx.restore();
    };

    const loop = () => {
      s.tick++;

      // background sky
      const grd = ctx.createLinearGradient(0, 0, 0, GAME_H);
      grd.addColorStop(0, "#0b1a3a");
      grd.addColorStop(1, "#7a1b1b");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // stars
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + s.tick * 0.3) % GAME_W;
        const sy = (i * 53) % 180;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // buildings back
      drawBuilding(20, 250, 90, 230, "#1a1a2e");
      drawBuilding(130, 200, 80, 280, "#151528");
      drawBuilding(230, 270, 110, 210, "#1a1a2e");
      drawBuilding(360, 220, 90, 260, "#151528");
      drawBuilding(470, 260, 100, 220, "#1a1a2e");
      drawBuilding(590, 210, 110, 270, "#151528");

      // ground
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, GAME_H - 20, GAME_W, 20);

      // spidey swing
      s.spidey.swing += 0.04;
      s.spidey.x = GAME_W - 90 + Math.sin(s.spidey.swing) * 20;
      s.spidey.y = 220 + Math.cos(s.spidey.swing * 1.3) * 10;

      // difficulty ramp — enemies keep getting faster
      if (s.running) {
        s.ramp += s.endless ? 0.00035 : 0.00018;
        if (s.tick % 30 === 0) setSpeedInfo(Math.round(s.ramp * 100) / 100);
      }

      // hold-to-fire
      if (s.cooldown > 0) s.cooldown--;
      if (s.running && s.firing && s.cooldown === 0) {
        s.cooldown = 9;
        shootRef.current(s.aim.x, s.aim.y);
      }

      // spawn villains
      if (s.running) {
        const lvl = s.level;
        if (lvl.boss && !s.bossSpawned) {
          s.bossSpawned = true;
          const spec = VILLAINS.boss;
          s.villains.push({
            id: s.idCounter++,
            kind: "boss",
            x: -60,
            y: 240,
            vx: spec.speed * lvl.speedMul,
            hp: spec.hp,
            maxHp: spec.hp,
            hit: false,
            flash: 0,
            wobble: 0,
          });
        }
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          const kind = lvl.kinds[Math.floor(Math.random() * lvl.kinds.length)];
          const spec = VILLAINS[kind];
          s.villains.push({
            id: s.idCounter++,
            kind,
            x: -30,
            y: 110 + Math.random() * 250,
            vx: spec.speed * lvl.speedMul * s.ramp,
            hp: spec.hp,
            maxHp: spec.hp,
            hit: false,
            flash: 0,
            wobble: Math.random() * Math.PI * 2,
          });
          const base = lvl.spawnBase / s.ramp;
          s.spawnTimer = Math.max(16, base * (0.7 + Math.random() * 0.6));
        }
      }

      // update villains
      for (const v of s.villains) {
        if (!v.hit && s.running) v.x += v.vx * (v.kind === "boss" ? 1 : s.ramp * 0.5 + 0.5);
        if (v.flash > 0) v.flash--;
        v.wobble += 0.15;
      }
      // villain reaches spidey
      if (s.running) {
        for (const v of s.villains) {
          if (!v.hit && v.x > s.spidey.x - 30) {
            v.hit = true;
            s.lives -= v.kind === "boss" ? 3 : 1;
            setLives(Math.max(0, s.lives));
            if (s.lives <= 0) {
              s.running = false;
              onFailRef.current();
            }
          }
        }
        // level cleared?
        if (s.running && s.kills >= s.level.target) {
          s.running = false;
          onClearRef.current();
        }
        // story beats
        for (const b of s.level.beats) {
          if (s.kills >= b.at && !s.beatsDone.has(b.at)) {
            s.beatsDone.add(b.at);
            beatRef.current(b);
          }
        }
      }
      // cleanup
      s.villains = s.villains.filter((v) => !(v.hit && v.wobble > 20) && v.x < GAME_W + 60);
      for (const v of s.villains) if (v.hit) v.wobble += 0.5;

      // draw villains
      for (const v of s.villains) drawVillain(v);

      // draw webs (short-lived beam)
      s.webs = s.webs.filter((w) => w.t < 12);
      for (const w of s.webs) {
        w.t++;
        ctx.strokeStyle = `rgba(255,255,255,${1 - w.t / 12})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.lineTo(w.targetX, w.targetY);
        ctx.stroke();
        // splat
        ctx.fillStyle = `rgba(255,255,255,${1 - w.t / 12})`;
        ctx.beginPath();
        ctx.arc(w.targetX, w.targetY, 6 + w.t, 0, Math.PI * 2);
        ctx.fill();
      }

      // draw spidey
      drawSpidey(s.spidey.x, s.spidey.y, s.spidey.swing);

      // crosshair reticle
      if (s.running && s.aim.active) {
        const { x, y } = s.aim;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 14 + Math.sin(s.tick * 0.15) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(x - 22, y);
        ctx.lineTo(x - 8, y);
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 22, y);
        ctx.moveTo(x, y - 22);
        ctx.lineTo(x, y - 8);
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, y + 22);
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // stable refs for callbacks used inside the mounted loop
  const shootRef = useRef<(x: number, y: number) => void>(() => {});
  shootRef.current = shootAt;
  const beatTimer = useRef<number | null>(null);
  const beatRef = useRef<(b: { who: string; text: string }) => void>(() => {});
  beatRef.current = (b) => {
    setBeat({ who: b.who, text: b.text });
    if (beatTimer.current) window.clearTimeout(beatTimer.current);
    beatTimer.current = window.setTimeout(() => setBeat(null), 4200);
  };

  // level end handlers via refs (loop is mounted once)
  const onClearRef = useRef(() => {});
  const onFailRef = useRef(() => {});
  onClearRef.current = () => {
    const s = stateRef.current;
    const isEndless = s.endless;
    const nextUnlocked = isEndless
      ? progress.unlocked_level
      : Math.max(progress.unlocked_level, Math.min(LEVELS.length, levelIndex + 2));
    persist({
      level: isEndless ? progress.level : Math.min(LEVELS.length, levelIndex + 2),
      unlocked_level: nextUnlocked,
      best_score: Math.max(progress.best_score, s.score),
      total_score: progress.total_score + s.score,
      endless_unlocked: progress.endless_unlocked || (!isEndless && levelIndex + 1 >= LEVELS.length),
    });
    setScreen("cleared");
  };
  onFailRef.current = () => {
    const s = stateRef.current;
    persist({
      best_score: Math.max(progress.best_score, s.score),
      total_score: progress.total_score + s.score,
      endless_best: s.endless ? Math.max(progress.endless_best, s.score) : progress.endless_best,
    });
    setScreen("over");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toGame(e.clientX, e.clientY);
    if (!p) return;
    const s = stateRef.current;
    s.aim.x = p.x;
    s.aim.y = p.y;
    s.aim.active = true;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
    if (screen !== "play") return;
    const p = toGame(e.clientX, e.clientY);
    if (!p) return;
    const s = stateRef.current;
    s.aim.x = p.x;
    s.aim.y = p.y;
    s.aim.active = true;
    s.firing = true;
    s.cooldown = 8;
    shootAt(p.x, p.y);
  };

  const stopFiring = () => {
    stateRef.current.firing = false;
  };

  const onPointerLeave = () => {
    stateRef.current.firing = false;
    stateRef.current.aim.active = false;
  };

  // lock body scroll while open (mobile UX)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="kse-game-modal fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overscroll-contain"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0b1a3a] border-2 sm:border-4 border-orange-500 rounded-xl sm:rounded-2xl shadow-2xl max-w-[760px] w-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 border-orange-500/50">
          <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-3">
            <span className="truncate text-orange-500 font-black text-sm sm:text-lg tracking-wider">
              KSE · WEB-SLINGER
            </span>
            <span className="hidden sm:inline truncate text-white/70 text-sm">
              {screen === "menu" ? "Wähle deine Mission" : `${endless ? "Endlos" : `Level ${level.id}`} · ${level.name}`}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-white font-mono text-xs sm:text-sm">
              <span className="text-orange-400">SCORE</span> {score}
            </div>
            {screen === "play" && (
              <div className="hidden sm:block text-white font-mono text-xs sm:text-sm">
                <span className="text-cyan-400">SPEED</span> ×{speedInfo.toFixed(2)}
              </div>
            )}
            <div className="text-white font-mono text-xs sm:text-sm">
              <span className="text-red-400">♥</span> {Math.max(0, lives)}
            </div>
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="text-white/80 hover:text-white p-2 -m-1 rounded hover:bg-white/10 touch-manipulation"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="relative p-2 sm:p-3 flex-1 min-h-0 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={GAME_W}
            height={GAME_H}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopFiring}
            onPointerCancel={stopFiring}
            onPointerLeave={onPointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            className="kse-game-canvas w-full h-auto max-h-full rounded-lg cursor-crosshair touch-none select-none"
            style={{ aspectRatio: `${GAME_W} / ${GAME_H}` }}
          />

          {screen === "play" && (
            <div className="pointer-events-none absolute top-4 left-5 right-5 flex items-center gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/80 whitespace-nowrap">
                {endless ? "Endlos" : `Lvl ${level.id}`}
              </div>
              <div className="h-2 flex-1 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{
                    width: endless
                      ? `${Math.min(100, (speedInfo - 1) * 200)}%`
                      : `${Math.min(100, (kills / level.target) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[10px] font-mono text-white/80 whitespace-nowrap">
                {endless ? `${kills} K.O. · ×${speedInfo.toFixed(2)}` : `${kills}/${level.target}`}
              </div>
            </div>
          )}

          {screen === "play" && beat && (
            <div className="pointer-events-none absolute bottom-6 left-6 right-6 flex justify-center">
              <div className="max-w-[90%] rounded-lg border-2 border-orange-500/70 bg-black/80 px-4 py-2 animate-fade-in">
                <span className="text-orange-400 font-black text-[10px] uppercase tracking-[0.25em] mr-2">
                  {beat.who}
                </span>
                <span className="text-white text-sm">{beat.text}</span>
              </div>
            </div>
          )}

          {screen !== "play" && (
            <div className="absolute inset-2 sm:inset-3 rounded-lg bg-black/85 overflow-y-auto p-4 sm:p-6 text-white">
              {loading ? (
                <div className="h-full flex items-center justify-center text-white/70 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Spielstand wird geladen…
                </div>
              ) : screen === "menu" ? (
                <div>
                  <h2 className="text-orange-500 font-black text-xl sm:text-2xl tracking-wider mb-1">
                    MISSIONS-AUSWAHL
                  </h2>
                  <p className="text-white/60 text-xs mb-3">
                    Fortschritt gespeichert · Bestscore {progress.best_score} · Gesamt {progress.total_score}
                    {progress.endless_best > 0 && ` · Endlos-Best ${progress.endless_best}`}
                  </p>
                  <div className="mb-4 border-l-2 border-orange-500/60 pl-3 space-y-1">
                    {PROLOGUE.map((line, i) => (
                      <p key={i} className="text-white/70 text-[12px] leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setEndless(true);
                        setScreen("story");
                      }}
                      className="text-left border-2 rounded-lg p-3 transition-colors border-cyan-400/70 hover:bg-cyan-400/15 sm:col-span-2"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                        <InfinityIcon className="w-3 h-3" />
                        Endlos · sofort spielbar
                      </div>
                      <div className="font-black text-sm mt-1">Endlosmodus</div>
                      <div className="text-[11px] text-white/50 mt-0.5">
                        Immer offen · Gegner werden pausenlos schneller · kein Ende
                      </div>
                    </button>
                    {LEVELS.map((l, i) => {
                      const locked = l.id > progress.unlocked_level;
                      return (
                        <button
                          key={l.id}
                          disabled={locked}
                          onClick={() => {
                            setLevelIndex(i);
                            setEndless(false);
                            setScreen("story");
                          }}
                          className={`text-left border-2 rounded-lg p-3 transition-colors ${
                            locked
                              ? "border-white/10 text-white/30 cursor-not-allowed"
                              : "border-orange-500/60 hover:bg-orange-500/15"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-400">
                            {locked ? <Lock className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            Level {l.id}
                          </div>
                          <div className="font-black text-sm mt-1">{l.name}</div>
                          <div className="text-[11px] text-white/40">{l.place}</div>
                          <div className="text-[11px] text-white/50 mt-0.5">
                            {l.boss ? "Bosskampf" : `${l.target} Gegner`} · Tempo ×{l.speedMul}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : screen === "story" ? (
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">
                    {endless ? "Endlos" : `Kapitel ${level.id}`}
                  </div>
                  <h2 className="font-black text-2xl tracking-wide mt-1">{level.name}</h2>
                  <div className="text-white/40 text-[11px] uppercase tracking-widest mb-3">{level.place}</div>
                  <div className="space-y-2 mb-5">
                    {level.intro.map((line, i) => (
                      <p key={i} className="text-white/80 text-sm leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="text-white/50 text-xs mb-5">
                    Ziel: {endless ? "so lange überleben wie möglich" : level.boss ? "Boss besiegen" : `${level.target} Gegner ausschalten`} ·
                    Leben: {level.lives} · Gegner werden mit der Zeit schneller · Maus bewegen zum Zielen, klicken/halten zum Netzschuss
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startLevel(levelIndex, endless)}
                      className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black px-5 py-2.5 rounded-lg tracking-wider"
                    >
                      LOS GEHT'S
                    </button>
                    <button
                      onClick={() => setScreen("menu")}
                      className="border-2 border-white/25 hover:border-white/50 px-4 py-2.5 rounded-lg font-black tracking-wider text-sm"
                    >
                      ZURÜCK
                    </button>
                  </div>
                </div>
              ) : screen === "cleared" ? (
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
                  <h2 className="text-green-400 font-black text-3xl tracking-wider mb-2">LEVEL GESCHAFFT</h2>
                  <div className="space-y-2 mb-4">
                    {(endless ? [] : level.outro).map((line, i) => (
                      <p key={i} className="text-white/80 text-sm leading-relaxed">
                        {line}
                      </p>
                    ))}
                    {!endless &&
                      levelIndex + 1 >= LEVELS.length &&
                      EPILOGUE.map((line, i) => (
                        <p key={`ep-${i}`} className="text-orange-200/90 text-sm leading-relaxed">
                          {line}
                        </p>
                      ))}
                  </div>
                  <p className="text-white/60 text-xs mb-5">
                    Score {score} · Bestscore {progress.best_score} · Fortschritt gespeichert
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!endless && levelIndex + 1 < LEVELS.length && (
                      <button
                        onClick={() => {
                          setLevelIndex(levelIndex + 1);
                          setEndless(false);
                          setScreen("story");
                        }}
                        className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black px-5 py-2.5 rounded-lg tracking-wider"
                      >
                        NÄCHSTES LEVEL
                      </button>
                    )}
                    {!endless && levelIndex + 1 >= LEVELS.length && (
                      <button
                        onClick={() => {
                          setEndless(true);
                          setScreen("story");
                        }}
                        className="bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-black font-black px-5 py-2.5 rounded-lg tracking-wider"
                      >
                        ENDLOSMODUS
                      </button>
                    )}
                    <button
                      onClick={() => setScreen("menu")}
                      className="border-2 border-white/25 hover:border-white/50 px-4 py-2.5 rounded-lg font-black tracking-wider text-sm"
                    >
                      MISSIONEN
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
                  <h2 className="text-orange-500 font-black text-3xl tracking-wider mb-2">GAME OVER</h2>
                  <p className="text-white/70 text-sm mb-5">
                    Score {score} · Bestscore {progress.best_score}
                    {endless && ` · Endlos-Best ${progress.endless_best}`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startLevel(levelIndex, endless)}
                      className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black px-5 py-2.5 rounded-lg tracking-wider"
                    >
                      NOCHMAL
                    </button>
                    <button
                      onClick={() => setScreen("menu")}
                      className="border-2 border-white/25 hover:border-white/50 px-4 py-2.5 rounded-lg font-black tracking-wider text-sm"
                    >
                      MISSIONEN
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4 gap-3">
          <div className="text-white/60 text-[11px] sm:text-xs">
            Bestscore: <span className="text-orange-400 font-bold">{progress.best_score}</span>
            <span className="hidden sm:inline"> · Tippe zum Netz-Schuss · Fortschritt wird serverseitig gespeichert</span>
          </div>
          {screen === "play" && (
            <button
              onClick={() => {
                stateRef.current.running = false;
                setScreen("menu");
              }}
              className="border-2 border-white/25 hover:border-white/50 text-white px-4 py-2 rounded-lg font-black tracking-wider text-sm touch-manipulation"
            >
              PAUSE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}