import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Active-Theory–inspired immersive hero.
 * Pure Canvas2D + CSS — no WebGL, no GSAP. SSR-safe (effects gated on mount).
 *
 * Layers (back → front):
 *  1. Pitch black background with radial vignette
 *  2. Canvas particle field (cool blue dust + warm yellow embers, parallax drift)
 *  3. Volumetric light beam (CSS conic + blur)
 *  4. Metallic orb: concentric rings + chromatic logo glyph + reflection trail
 *  5. Tiny tracked HUD label, top-centered
 */
export default function ImmersiveHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.5 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const labelOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  /* ─── particle field ─── */
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
      r: number; hue: "cool" | "warm";
      tw: number; tp: number;
    };
    let parts: P[] = [];

    const seed = () => {
      const count = Math.floor((w * h) / 9000);
      parts = Array.from({ length: count }, () => {
        const warm = Math.random() < 0.18;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 0.9 + 0.1,
          vx: (Math.random() - 0.5) * 0.08,
          vy: -Math.random() * 0.12 - 0.02,
          r: Math.random() * 1.6 + 0.4,
          hue: warm ? "warm" : "cool",
          tw: Math.random() * Math.PI * 2,
          tp: Math.random() * 0.04 + 0.015,
        };
      });
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

        if (p.hue === "warm") {
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
    <section
      ref={sectionRef}
      id="top"
      className="relative w-full overflow-hidden"
      style={{ height: "100vh", background: "#020207" }}
    >
      {/* Deep radial vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(20,28,60,0.55) 0%, rgba(4,4,12,0.9) 45%, #000 100%)",
        }}
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* Tiny tracked label, top centered */}
      <motion.div
        style={{ opacity: labelOpacity }}
        className="absolute left-0 right-0 top-[18vh] md:top-[14vh] flex justify-center pointer-events-none z-[3]"
      >
        <span
          className="text-[10px] md:text-[11px] tracking-[0.5em] uppercase font-semibold"
          style={{ color: "#f0ede8", textShadow: "0 0 18px rgba(0,0,0,0.9)" }}
        >
          KSE / GROUP — Independent Studio
        </span>
      </motion.div>

      {/* Volumetric light beam — angled, behind orb */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none z-[1]"
        style={{
          width: "180vmax",
          height: "12vmax",
          transform: "translate(-50%,-50%) rotate(-12deg)",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(180,200,255,0.05) 30%, rgba(220,230,255,0.18) 50%, rgba(180,200,255,0.05) 70%, transparent 100%)",
          filter: "blur(14px)",
          mixBlendMode: "screen",
        }}
      />

      {/* The orb */}
      <motion.div
        style={{ y: orbY, scale: orbScale }}
        className="absolute inset-0 flex items-center justify-center z-[2] pointer-events-none"
      >
        <Orb />
      </motion.div>

      {/* Faint floating jellyfish silhouette (left) */}
      <Jelly className="absolute left-[12%] top-[55%] z-[2]" delay={0} scale={0.7} />
      <Jelly className="absolute right-[8%] bottom-[18%] z-[2]" delay={2.8} scale={0.5} />

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.4] }}
        transition={{ duration: 2.5, delay: 1.4, times: [0, 0.4, 0.7, 1] }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[4] pointer-events-none"
      >
        <span className="text-[9px] tracking-[0.5em] uppercase text-foreground/60">scroll</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-8"
          style={{ background: "linear-gradient(to bottom, transparent, #e8ff00)" }}
        />
      </motion.div>
    </section>
  );
}

/* ───────── Orb ───────── */
function Orb() {
  return (
    <div
      className="relative"
      style={{ width: "min(64vw, 520px)", aspectRatio: "1 / 1" }}
    >
      {/* Outer slow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: "1px solid rgba(200,215,255,0.18)",
          boxShadow:
            "0 0 80px rgba(120,140,220,0.18), inset 0 0 60px rgba(120,140,220,0.12)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
      {/* Mid ring, dashed */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: "8%",
          border: "1px dashed rgba(200,215,255,0.22)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner chromatic disc */}
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
        {/* Specular highlight */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6) 0%, transparent 22%), radial-gradient(circle at 70% 75%, rgba(232,255,0,0.18) 0%, transparent 35%)",
            mixBlendMode: "screen",
          }}
        />
      </motion.div>

      {/* Glass dome over disc (counter-rotates to keep letter upright) */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          inset: "18%",
          background:
            "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)",
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

      {/* Bottom reflection / drip ring */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: "-22%",
          width: "8%",
          height: "44%",
          border: "1px solid rgba(180,200,255,0.35)",
          borderTop: "none",
          borderRadius: "0 0 100% 100% / 0 0 60% 60%",
          filter: "blur(0.3px)",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ───────── Jellyfish silhouette ───────── */
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
        <radialGradient id="jbody" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(180,210,255,0.55)" />
          <stop offset="100%" stopColor="rgba(60,90,160,0)" />
        </radialGradient>
      </defs>
      <path
        d="M50 8 C 78 8, 92 38, 88 60 C 86 70, 78 72, 72 68 C 66 64, 64 70, 66 76 C 70 92, 60 110, 56 130 C 54 142, 52 150, 50 156 C 48 150, 46 142, 44 130 C 40 110, 30 92, 34 76 C 36 70, 34 64, 28 68 C 22 72, 14 70, 12 60 C 8 38, 22 8, 50 8 Z"
        fill="url(#jbody)"
        opacity="0.9"
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