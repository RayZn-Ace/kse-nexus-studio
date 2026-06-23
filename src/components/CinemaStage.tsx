import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";

/**
 * Persistent fixed-position visual stage that lives behind every section.
 * Active-Theory-inspired: deep space vignette + drifting particle field +
 * volumetric light beam + central metallic orb that scales/drifts with scroll.
 *
 * Pure Canvas2D + CSS. SSR-safe (effects gated on mount).
 */
export default function CinemaStage({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.5 });

  // Orb behaviour across the whole page scroll
  const orbY = useTransform(progress, [0, 0.5, 1], ["0vh", "-12vh", "8vh"]);
  const orbScale = useTransform(progress, [0, 0.25, 0.55, 1], [1, 0.55, 0.35, 0.9]);
  const orbX = useTransform(progress, [0, 0.25, 0.55, 0.8, 1], ["0vw", "22vw", "-26vw", "18vw", "0vw"]);
  const orbOpacity = useTransform(progress, [0, 0.6, 0.95, 1], [1, 0.55, 0.25, 0.4]);
  const beamRotate = useTransform(progress, [0, 1], [-12, 18]);
  const beamOpacity = useTransform(progress, [0, 0.4, 0.8, 1], [1, 0.35, 0.15, 0.05]);

  const orbYS = useSpring(orbY, { stiffness: 70, damping: 22, mass: 0.4 });
  const orbXS = useSpring(orbX, { stiffness: 70, damping: 22, mass: 0.4 });
  const orbScaleS = useSpring(orbScale, { stiffness: 70, damping: 22, mass: 0.4 });

  /* particle field */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = {
      x: number; y: number; z: number;
      vx: number; vy: number;
      r: number; warm: boolean;
      tw: number; tp: number;
    };
    let parts: P[] = [];

    const seed = () => {
      const count = Math.floor((w * h) / 9000);
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.9 + 0.1,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -Math.random() * 0.12 - 0.02,
        r: Math.random() * 1.6 + 0.4,
        warm: Math.random() < 0.18,
        tw: Math.random() * Math.PI * 2,
        tp: Math.random() * 0.04 + 0.015,
      }));
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = (e.clientX - rect.left) / rect.width;
      pointer.current.y = (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("pointermove", onMove);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      const px = (pointer.current.x - 0.5) * 30;
      const py = (pointer.current.y - 0.5) * 30;

      for (const p of parts) {
        p.x += p.vx + px * 0.0008 * p.z;
        p.y += p.vy + py * 0.0008 * p.z;
        p.tw += p.tp;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const a = (0.35 + Math.sin(p.tw) * 0.35) * p.z;
        const r = p.r * (0.6 + p.z * 0.8);
        if (p.warm) {
          ctx.fillStyle = `rgba(232,255,0,${a * 0.7})`;
          ctx.shadowColor = "rgba(232,255,0,0.9)";
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = `rgba(140,180,230,${a * 0.55})`;
          ctx.shadowColor = "rgba(120,160,220,0.7)";
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, background: "#020207" }}
    >
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(20,28,60,0.55) 0%, rgba(4,4,12,0.92) 45%, #000 100%)",
        }}
      />
      {/* particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* light beam */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{
          width: "180vmax",
          height: "12vmax",
          x: "-50%",
          y: "-50%",
          rotate: beamRotate,
          opacity: beamOpacity,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,200,255,0.05) 30%, rgba(220,230,255,0.18) 50%, rgba(180,200,255,0.05) 70%, transparent 100%)",
          filter: "blur(14px)",
          mixBlendMode: "screen",
        }}
      />

      {/* orb */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: orbXS, y: orbYS, scale: orbScaleS, opacity: orbOpacity }}
      >
        <Orb />
      </motion.div>

      {/* jellyfish silhouettes */}
      <Jelly className="absolute left-[10%] top-[60%]" delay={0} scale={0.7} />
      <Jelly className="absolute right-[8%] top-[28%]" delay={2.8} scale={0.5} />
      <Jelly className="absolute left-[60%] bottom-[12%]" delay={4.2} scale={0.6} />
    </div>
  );
}

function Orb() {
  return (
    <div className="relative" style={{ width: "min(64vw, 520px)", aspectRatio: "1 / 1" }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: "1px solid rgba(200,215,255,0.18)",
          boxShadow: "0 0 80px rgba(120,140,220,0.18), inset 0 0 60px rgba(120,140,220,0.12)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ inset: "8%", border: "1px dashed rgba(200,215,255,0.22)" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute rounded-full overflow-hidden"
        style={{
          inset: "18%",
          background:
            "conic-gradient(from 210deg, #b9c8ff, #6e7bd1 18%, #1a1830 32%, #0a0a1a 48%, #2a223a 58%, #b87a4a 70%, #e8b86a 78%, #f5e8a0 86%, #b9c8ff 100%)",
          filter: "saturate(1.1) brightness(0.95)",
          boxShadow:
            "0 0 60px rgba(120,140,220,0.45), inset 0 -20px 60px rgba(0,0,0,0.6), inset 0 20px 40px rgba(255,255,255,0.08)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6) 0%, transparent 22%), radial-gradient(circle at 70% 75%, rgba(232,255,0,0.18) 0%, transparent 35%)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: "18%",
          background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)",
        }}
      >
        <span
          className="font-black select-none"
          style={{
            fontSize: "min(18vw, 150px)",
            color: "#f0ede8",
            letterSpacing: "-0.06em",
            textShadow:
              "0 2px 0 rgba(0,0,0,0.25), 0 0 24px rgba(180,200,255,0.45), 0 0 60px rgba(232,255,0,0.18)",
            mixBlendMode: "screen",
          }}
        >
          k
        </span>
      </div>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: "-22%",
          width: "8%",
          height: "44%",
          border: "1px solid rgba(180,200,255,0.35)",
          borderTop: "none",
          borderRadius: "0 0 100% 100% / 0 0 60% 60%",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function Jelly({
  className = "",
  delay = 0,
  scale = 1,
}: { className?: string; delay?: number; scale?: number }) {
  return (
    <motion.svg
      viewBox="0 0 100 160"
      className={className}
      width={80 * scale}
      height={128 * scale}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 0.35, 0.2, 0.4], y: [20, -20, 0, -10] }}
      transition={{ duration: 9, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "blur(0.4px)" }}
    >
      <defs>
        <radialGradient id={`jb-${delay}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(180,210,255,0.55)" />
          <stop offset="100%" stopColor="rgba(60,90,160,0)" />
        </radialGradient>
      </defs>
      <path
        d="M50 8 C 78 8, 92 38, 88 60 C 86 70, 78 72, 72 68 C 66 64, 64 70, 66 76 C 70 92, 60 110, 56 130 C 54 142, 52 150, 50 156 C 48 150, 46 142, 44 130 C 40 110, 30 92, 34 76 C 36 70, 34 64, 28 68 C 22 72, 14 70, 12 60 C 8 38, 22 8, 50 8 Z"
        fill={`url(#jb-${delay})`}
      />
      <path
        d="M40 70 Q42 110 38 150 M50 72 Q52 120 50 158 M60 70 Q58 110 62 150"
        stroke="rgba(180,210,255,0.45)"
        strokeWidth="0.6"
        fill="none"
      />
    </motion.svg>
  );
}