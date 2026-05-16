import { useEffect, useRef } from "react";

interface Orb {
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  periodX: number;
  periodY: number;
  phaseX: number;
  phaseY: number;
  radius: number;
  color: string; // rgb without alpha
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    let orbs: Orb[] = [];
    let stars: Star[] = [];

    const KSE_YELLOW = "232,255,0";
    const KSE_OFFWHITE = "240,237,232";

    const buildScene = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 5 orbs — center-weighted, drift in sin/cos waves
      orbs = [
        { baseX: W * 0.5,  baseY: H * 0.45, radius: 480, color: KSE_YELLOW,   ampX: 120, ampY: 90,  periodX: 14, periodY: 11, phaseX: 0,   phaseY: 1.3 },
        { baseX: W * 0.28, baseY: H * 0.35, radius: 360, color: KSE_OFFWHITE, ampX: 100, ampY: 130, periodX: 12, periodY: 15, phaseX: 0.7, phaseY: 0.2 },
        { baseX: W * 0.72, baseY: H * 0.55, radius: 400, color: KSE_OFFWHITE, ampX: 140, ampY: 110, periodX: 13, periodY: 9,  phaseX: 1.9, phaseY: 2.4 },
        { baseX: W * 0.4,  baseY: H * 0.7,  radius: 280, color: KSE_YELLOW,   ampX: 90,  ampY: 100, periodX: 10, periodY: 12, phaseX: 2.6, phaseY: 0.9 },
        { baseX: W * 0.65, baseY: H * 0.25, radius: 220, color: KSE_OFFWHITE, ampX: 110, ampY: 80,  periodX: 8,  periodY: 13, phaseX: 3.4, phaseY: 1.7 },
      ];

      // 80 static stars
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() < 0.15 ? 2.5 : 2,
        alpha: 0.3 + Math.random() * 0.3,
      }));
    };

    const onResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      buildScene();
    };

    buildScene();
    window.addEventListener("resize", onResize);

    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;

      // Background fill
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Orbs
      ctx.globalCompositeOperation = "lighter";
      for (const o of orbs) {
        const x = o.baseX + Math.sin((t / o.periodX) * Math.PI * 2 + o.phaseX) * o.ampX;
        const y = o.baseY + Math.cos((t / o.periodY) * Math.PI * 2 + o.phaseY) * o.ampY;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, o.radius);
        grad.addColorStop(0,    `rgba(${o.color},0.15)`);
        grad.addColorStop(0.55, `rgba(${o.color},0.05)`);
        grad.addColorStop(1,    `rgba(${o.color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // Stars
      for (const s of stars) {
        ctx.fillStyle = `rgba(240,237,232,${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
