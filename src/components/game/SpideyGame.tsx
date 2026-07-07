import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

type Villain = { id: number; x: number; y: number; vx: number; hit: boolean; wobble: number };
type Web = { id: number; x: number; y: number; targetX: number; targetY: number; t: number };

const GAME_W = 720;
const GAME_H = 480;

export function SpideyGame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(true);
  const [highscore, setHighscore] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("kse_spidey_hs") || 0);
  });

  const stateRef = useRef({
    villains: [] as Villain[],
    webs: [] as Web[],
    spawnTimer: 0,
    tick: 0,
    score: 0,
    lives: 3,
    running: true,
    spidey: { x: GAME_W - 90, y: 220, swing: 0 },
    idCounter: 1,
  });

  // sync running/lives to ref
  useEffect(() => {
    stateRef.current.running = running;
  }, [running]);

  const shoot = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_W / rect.width;
    const scaleY = GAME_H / rect.height;
    const tx = (clientX - rect.left) * scaleX;
    const ty = (clientY - rect.top) * scaleY;
    const s = stateRef.current;
    s.webs.push({
      id: s.idCounter++,
      x: s.spidey.x,
      y: s.spidey.y,
      targetX: tx,
      targetY: ty,
      t: 0,
    });
    // hit detection
    let hit = false;
    for (const v of s.villains) {
      if (v.hit) continue;
      const dx = v.x - tx;
      const dy = v.y - ty;
      // generous hit radius for touch
      if (Math.hypot(dx, dy) < 55) {
        v.hit = true;
        s.score += 10;
        setScore(s.score);
        hit = true;
        break;
      }
    }
    void hit;
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
      ctx.save();
      ctx.translate(v.x, v.y + Math.sin(v.wobble) * 4);
      if (v.hit) {
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 28px system-ui";
        ctx.fillText("POW!", -22, 0);
        ctx.restore();
        return;
      }
      // body: green goblin-ish blob
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(0, -2, 22, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(-6, -3, 3, 0, Math.PI * 2);
      ctx.arc(6, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      // grin
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 4, 8, 0, Math.PI);
      ctx.stroke();
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

      // spawn villains
      if (s.running) {
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          const speed = 1.2 + Math.min(3, s.score / 80);
          s.villains.push({
            id: s.idCounter++,
            x: -30,
            y: 120 + Math.random() * 240,
            vx: speed,
            hit: false,
            wobble: Math.random() * Math.PI * 2,
          });
          s.spawnTimer = 60 + Math.random() * 60 - Math.min(40, s.score / 5);
        }
      }

      // update villains
      for (const v of s.villains) {
        if (!v.hit && s.running) v.x += v.vx;
        v.wobble += 0.15;
      }
      // villain reaches spidey
      if (s.running) {
        for (const v of s.villains) {
          if (!v.hit && v.x > s.spidey.x - 30) {
            v.hit = true;
            s.lives--;
            setLives(s.lives);
            if (s.lives <= 0) {
              s.running = false;
              setRunning(false);
              const hs = Math.max(s.score, Number(localStorage.getItem("kse_spidey_hs") || 0));
              localStorage.setItem("kse_spidey_hs", String(hs));
              setHighscore(hs);
            }
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

      // game over overlay
      if (!s.running) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 56px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", GAME_W / 2, GAME_H / 2 - 20);
        ctx.fillStyle = "#fff";
        ctx.font = "20px system-ui";
        ctx.fillText(`Score: ${s.score}   Highscore: ${highscore}`, GAME_W / 2, GAME_H / 2 + 20);
        ctx.fillText("Klick unten auf NEUSTART", GAME_W / 2, GAME_H / 2 + 50);
        ctx.textAlign = "start";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [highscore]);

  const reset = () => {
    const s = stateRef.current;
    s.villains = [];
    s.webs = [];
    s.score = 0;
    s.lives = 3;
    s.spawnTimer = 0;
    s.running = true;
    setScore(0);
    setLives(3);
    setRunning(true);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!running) return;
    shoot(e.clientX, e.clientY);
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
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overscroll-contain"
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
            <span className="hidden sm:inline text-white/70 text-sm">Tippe die Gegner!</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-white font-mono text-xs sm:text-sm">
              <span className="text-orange-400">SCORE</span> {score}
            </div>
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
        <div className="p-2 sm:p-3 flex-1 min-h-0 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={GAME_W}
            height={GAME_H}
            onPointerDown={onPointerDown}
            className="w-full h-auto max-h-full rounded-lg cursor-crosshair touch-none select-none"
            style={{ aspectRatio: `${GAME_W} / ${GAME_H}` }}
          />
        </div>
        <div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4 gap-3">
          <div className="text-white/60 text-[11px] sm:text-xs">
            Highscore: <span className="text-orange-400 font-bold">{highscore}</span>
            <span className="hidden sm:inline"> · Tippe zum Netz-Schuss</span>
          </div>
          <button
            onClick={reset}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black px-4 sm:px-5 py-2 rounded-lg tracking-wider text-sm sm:text-base touch-manipulation"
          >
            {running ? "NEUSTART" : "NOCHMAL"}
          </button>
        </div>
      </div>
    </div>
  );
}