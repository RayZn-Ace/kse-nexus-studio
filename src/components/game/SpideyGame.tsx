import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  advanceClock,
  createClock,
  resetClock,
  createGame,
  beginPointer,
  endPointer,
  pointerPosition,
  stepGame,
  progressAfterRun,
  MECHANICS,
  WIDTH,
  HEIGHT,
} from "@/lib/game/engine";
import { createScene, renderGame } from "@/lib/game/scenery";
import "./game.css";
import { X, Lock, Play, Infinity as InfinityIcon, Loader2, Trophy } from "lucide-react";
import { LEVELS, ENDLESS_LEVEL, PROLOGUE, EPILOGUE, type Level } from "@/lib/game/levels";
import {
  loadProgress,
  saveProgress,
  loadLeaderboard,
  EMPTY_PROGRESS,
  getPlayerKey,
  type GameProgress,
  type LeaderboardEntry,
} from "@/lib/game/progress";

function Leaderboard({ refreshKey, compact = false }: { refreshKey: number; compact?: boolean }) {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const me = typeof window !== "undefined" ? getPlayerKey() : "";

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    loadLeaderboard("endless", compact ? 5 : 10)
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, [refreshKey, compact]);

  return (
    <div className="border-2  rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-3.5 h-3.5 " />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] ">
          Highscores · Endlosmodus
        </span>
      </div>
      {rows === null ? (
        <div className=" text-[11px] flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Lade Rangliste…
        </div>
      ) : rows.length === 0 ? (
        <div className=" text-[11px]">Noch keine Einträge — sei der Erste!</div>
      ) : (
        <ol className="space-y-1">
          {rows.map((r, i) => (
            <li
              key={r.player_key}
              className={`flex items-center gap-2 text-[12px] ${
                r.player_key === me ? " font-bold" : ""
              }`}
            >
              <span className="w-5 tabular-nums ">{i + 1}.</span>
              <span className="truncate flex-1">
                {r.display_name?.trim() || "Anonymer Held"}
                {r.player_key === me && " (du)"}
              </span>
              <span className="tabular-nums font-mono ">{r.endless_best}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

type Screen = "menu" | "story" | "play" | "cleared" | "over";
const GAME_W = WIDTH;
const GAME_H = HEIGHT;

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

  const initial = createGame();
  initial.running = false;
  const stateRef = useRef(initial);
  const clockRef = useRef(createClock());
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [bossHp, setBossHp] = useState(18);
  const [saveStatus, setSaveStatus] = useState("");

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
    const next = { ...progressRef.current, ...patch };
    progressRef.current = next;
    setProgress(next);
    setSaveStatus("Wird gespeichert …");
    void saveProgress(next)
      .then(() => {
        setSaveStatus("Speichern angefragt");
        setBoardKey((k) => k + 1);
      })
      .catch(() => setSaveStatus("Speichern fehlgeschlagen"));
  }, []);

  const startLevel = useCallback((index: number, isEndless: boolean) => {
    const lvl = isEndless ? ENDLESS_LEVEL : LEVELS[index];
    if (!lvl) return;
    stateRef.current = createGame(lvl, isEndless);
    resetClock(clockRef.current);
    setScore(0);
    setKills(0);
    setLives(lvl.lives);
    setSpeedInfo(1);
    setBossHp(18);
    setBeat(null);
    setSaveStatus("");
    setEndless(isEndless);
    setLevelIndex(index);
    setScreen("play");
  }, []);

  const completeRef = useRef(() => {});
  completeRef.current = () => {
    const s = stateRef.current;
    const next = progressAfterRun(progressRef.current, s);
    persist(next);
    setScreen(s.outcome === "cleared" ? "cleared" : "over");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const caches = new Map<number, ReturnType<typeof createScene>>();
    const clock = clockRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    const onMotion = () => {
      reduced = media.matches;
    };
    media.addEventListener("change", onMotion);
    let raf = 0;
    let lastUI = -1;
    const onVisibility = () => {
      resetClock(clock);
      endPointer(stateRef.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onVisibility);
    const loop = (timestamp: number) => {
      const s = stateRef.current;
      if (!document.hidden) advanceClock(clock, timestamp, () => stepGame(s));
      else resetClock(clock);
      let cache = caches.get(s.level.id);
      if (!cache) {
        cache = createScene(s.level.id);
        caches.set(s.level.id, cache);
      }
      renderGame(ctx, cache, s, reduced);
      if (s.tick !== lastUI && (s.tick % 6 === 0 || !s.running)) {
        setScore(s.score);
        setKills(s.kills);
        setLives(s.lives);
        setSpeedInfo(s.ramp);
        setBossHp(s.villains.find((v) => v.kind === "boss")?.hp ?? 18);
        setBeat(s.message);
        lastUI = s.tick;
      }
      if (s.outcome !== "playing" && !reported.has(s)) {
        reported.add(s);
        setScore(s.score);
        setLives(s.lives);
        setKills(s.kills);
        completeRef.current();
      }
      raf = requestAnimationFrame(loop);
    };
    const reported = new WeakSet();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      endPointer(stateRef.current);
      stateRef.current.running = false;
      resetClock(clock);
      caches.clear();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onVisibility);
      media.removeEventListener("change", onMotion);
    };
  }, []);

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.pointerId !== null && s.pointerId !== e.pointerId) return;
    const p = pointerPosition(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    if (p && s.running) s.aim = { ...p, active: true };
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "play") return;
    e.preventDefault();
    const p = pointerPosition(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    if (p && beginPointer(stateRef.current, e.pointerId, p.x, p.y)) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        endPointer(stateRef.current, e.pointerId);
      }
    }
  };
  const stopFiring = (e: React.PointerEvent<HTMLCanvasElement>) => {
    endPointer(stateRef.current, e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onPointerLeave = () => {
    if (stateRef.current.pointerId === null) stateRef.current.aim.active = false;
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
      role="dialog"
      aria-label="KSE Web-Slinger"
      aria-modal="true"
      className="kse-game-modal fixed inset-0 z-[200]  backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overscroll-contain"
      onClick={onClose}
    >
      <div
        className="game-shell relative  border-2 sm:border-4  rounded-xl sm:rounded-2xl shadow-2xl max-w-[760px] w-full max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 ">
          <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-3">
            <span className="truncate  font-black text-sm sm:text-lg tracking-wider">
              KSE · WEB-SLINGER
            </span>
            <span className="hidden sm:inline truncate  text-sm">
              {screen === "menu"
                ? "Wähle deine Mission"
                : `${endless ? "Endlos" : `Level ${level.id}`} · ${level.name}`}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className=" font-mono text-xs sm:text-sm">
              <span className="">SCORE</span> {score}
            </div>
            {screen === "play" && (
              <div className="hidden sm:block  font-mono text-xs sm:text-sm">
                <span className="">SPEED</span> ×{speedInfo.toFixed(2)}
              </div>
            )}
            <div className=" font-mono text-xs sm:text-sm">
              <span className="">♥</span> {Math.max(0, lives)}
            </div>
            <Button
              onClick={onClose}
              aria-label="Schließen"
              className="  p-2 -m-1 rounded  touch-manipulation"
            >
              <X size={20} />
            </Button>
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
            onLostPointerCapture={stopFiring}
            aria-label="Web-Slinger Spielfeld"
            onPointerLeave={onPointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            className="kse-game-canvas w-full h-auto max-h-full rounded-lg cursor-crosshair touch-none select-none"
          />

          {screen === "play" && (
            <div className="pointer-events-none absolute top-4 left-5 right-5 flex items-center gap-3">
              <div className="text-[10px] font-black uppercase tracking-widest  whitespace-nowrap">
                {endless ? "Endlos" : `Lvl ${level.id}`}
              </div>
              <div className="h-2 flex-1 rounded-full  overflow-hidden">
                <div
                  className="h-full  transition-all"
                  style={{
                    width: endless
                      ? `${Math.min(100, (speedInfo - 1) * 200)}%`
                      : `${level.boss ? ((18 - bossHp) / 18) * 100 : Math.min(100, (kills / level.target) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[10px] font-mono  whitespace-nowrap">
                {endless
                  ? `${kills} K.O. · ×${speedInfo.toFixed(2)}`
                  : level.boss
                    ? `${Math.max(0, bossHp)}/18 HP`
                    : `${kills}/${level.target}`}
              </div>
            </div>
          )}

          {screen === "play" && beat && (
            <div className="pointer-events-none absolute bottom-6 left-6 right-6 flex justify-center">
              <div className="max-w-[90%] rounded-lg border-2   px-4 py-2 animate-fade-in">
                <span className=" font-black text-[10px] uppercase tracking-[0.25em] mr-2">
                  {beat.who}
                </span>
                <span className=" text-sm">{beat.text}</span>
              </div>
            </div>
          )}

          {screen !== "play" && (
            <div className="absolute inset-2 sm:inset-3 rounded-lg  overflow-y-auto p-4 sm:p-6 ">
              {loading ? (
                <div className="h-full flex items-center justify-center  gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Spielstand wird geladen…
                </div>
              ) : screen === "menu" ? (
                <div>
                  <h2 className=" font-black text-xl sm:text-2xl tracking-wider mb-1">
                    MISSIONS-AUSWAHL
                  </h2>
                  <p className=" text-xs mb-3">
                    Fortschritt gespeichert · Bestscore {progress.best_score} · Gesamt{" "}
                    {progress.total_score}
                    {progress.endless_best > 0 && ` · Endlos-Best ${progress.endless_best}`}
                  </p>
                  <div className="mb-4 border-l-2  pl-3 space-y-1">
                    {PROLOGUE.map((line, i) => (
                      <p key={i} className=" text-[12px] leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <div className="border-2  rounded-lg p-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.25em]  block mb-2">
                        Heldenname für die Rangliste
                      </label>
                      <input
                        value={progress.display_name ?? ""}
                        onChange={(e) =>
                          setProgress((p) => ({ ...p, display_name: e.target.value.slice(0, 24) }))
                        }
                        onBlur={() => persist({ display_name: progress.display_name ?? null })}
                        placeholder="Anonymer Held"
                        className="w-full  border-2   outline-none rounded px-2 py-1.5 text-sm"
                      />
                      <p className=" text-[10px] mt-2">
                        Highscores werden serverseitig gespeichert.
                      </p>
                    </div>
                    <Leaderboard refreshKey={boardKey} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        stateRef.current = createGame(ENDLESS_LEVEL, true);
                        stateRef.current.running = false;
                        setEndless(true);
                        setScreen("story");
                      }}
                      className="text-left border-2 rounded-lg p-3 transition-colors   sm:col-span-2"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ">
                        <InfinityIcon className="w-3 h-3" />
                        Endlos · sofort spielbar
                      </div>
                      <div className="font-black text-sm mt-1">Endlosmodus</div>
                      <div className="text-[11px]  mt-0.5">
                        Immer offen · Gegner werden pausenlos schneller · kein Ende
                      </div>
                    </Button>
                    {LEVELS.map((l, i) => {
                      const locked = l.id > progress.unlocked_level;
                      return (
                        <Button
                          key={l.id}
                          disabled={locked}
                          onClick={() => {
                            stateRef.current = createGame(l);
                            stateRef.current.running = false;
                            setLevelIndex(i);
                            setEndless(false);
                            setScreen("story");
                          }}
                          className={`text-left border-2 rounded-lg p-3 transition-colors ${
                            locked ? "  cursor-not-allowed" : " "
                          }`}
                        >
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ">
                            {locked ? <Lock className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            Level {l.id}
                          </div>
                          <div className="font-black text-sm mt-1">{l.name}</div>
                          <div className="text-[11px] ">{l.place}</div>
                          <div className="text-[11px]  mt-0.5">
                            {l.boss ? "Bosskampf" : `${l.target} Gegner`} · Tempo ×{l.speedMul}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : screen === "story" ? (
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] ">
                    {endless ? "Endlos" : `Kapitel ${level.id}`}
                  </div>
                  <h2 className="font-black text-2xl tracking-wide mt-1">{level.name}</h2>
                  <div className=" text-[11px] uppercase tracking-widest mb-3">{level.place}</div>
                  <div className="space-y-2 mb-5">
                    {level.intro.map((line, i) => (
                      <p key={i} className=" text-sm leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                  <div className=" text-xs mb-5">
                    Ziel:{" "}
                    {endless
                      ? "so lange überleben wie möglich"
                      : level.boss
                        ? "Boss besiegen"
                        : `${level.target} Gegner ausschalten`}{" "}
                    · Leben: {level.lives}
                  </div>
                  <p className="game-brief">KayI · {MECHANICS[level.id]}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startLevel(levelIndex, endless)}
                      className="  active:scale-95  font-black px-5 py-2.5 rounded-lg tracking-wider"
                    >
                      LOS GEHT'S
                    </Button>
                    <Button
                      onClick={() => setScreen("menu")}
                      className="border-2   px-4 py-2.5 rounded-lg font-black tracking-wider text-sm"
                    >
                      ZURÜCK
                    </Button>
                  </div>
                </div>
              ) : screen === "cleared" ? (
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
                  <h2 className=" font-black text-3xl tracking-wider mb-2">LEVEL GESCHAFFT</h2>
                  <div className="space-y-2 mb-4">
                    {(endless ? [] : level.outro).map((line, i) => (
                      <p key={i} className=" text-sm leading-relaxed">
                        {line}
                      </p>
                    ))}
                    {!endless &&
                      levelIndex + 1 >= LEVELS.length &&
                      EPILOGUE.map((line, i) => (
                        <p key={`ep-${i}`} className=" text-sm leading-relaxed">
                          {line}
                        </p>
                      ))}
                  </div>
                  <p className=" text-xs mb-5">
                    Score {score} · Bestscore {progress.best_score} · Fortschritt gespeichert
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!endless && levelIndex + 1 < LEVELS.length && (
                      <Button
                        onClick={() => {
                          setLevelIndex(levelIndex + 1);
                          setEndless(false);
                          setScreen("story");
                        }}
                        className="  active:scale-95  font-black px-5 py-2.5 rounded-lg tracking-wider"
                      >
                        NÄCHSTES LEVEL
                      </Button>
                    )}
                    {!endless && levelIndex + 1 >= LEVELS.length && (
                      <Button
                        onClick={() => {
                          setEndless(true);
                          setScreen("story");
                        }}
                        className="  active:scale-95  font-black px-5 py-2.5 rounded-lg tracking-wider"
                      >
                        ENDLOSMODUS
                      </Button>
                    )}
                    <Button
                      onClick={() => setScreen("menu")}
                      className="border-2   px-4 py-2.5 rounded-lg font-black tracking-wider text-sm"
                    >
                      MISSIONEN
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-w-lg mx-auto h-full flex flex-col justify-center">
                  <h2 className=" font-black text-3xl tracking-wider mb-2">GAME OVER</h2>
                  <p className=" text-sm mb-5">
                    Score {score} · Bestscore {progress.best_score}
                    {endless && ` · Endlos-Best ${progress.endless_best}`}
                  </p>
                  <div className="mb-5">
                    <Leaderboard refreshKey={boardKey} compact />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => startLevel(levelIndex, endless)}
                      className="  active:scale-95  font-black px-5 py-2.5 rounded-lg tracking-wider"
                    >
                      NOCHMAL
                    </Button>
                    <Button
                      onClick={() => setScreen("menu")}
                      className="border-2   px-4 py-2.5 rounded-lg font-black tracking-wider text-sm"
                    >
                      MISSIONEN
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4 gap-3">
          <div className=" text-[11px] sm:text-xs">
            {saveStatus && <span role="status">{saveStatus} · </span>}Bestscore:{" "}
            <span className=" font-bold">{progress.best_score}</span>
            <span className="hidden sm:inline">
              {" "}
              · Tippe zum Netz-Schuss · Fortschritt wird serverseitig gespeichert
            </span>
          </div>
          {screen === "play" && (
            <Button
              onClick={() => {
                stateRef.current.running = false;
                endPointer(stateRef.current);
                resetClock(clockRef.current);
                setScreen("menu");
              }}
              className="border-2    px-4 py-2 rounded-lg font-black tracking-wider text-sm touch-manipulation"
            >
              PAUSE
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
