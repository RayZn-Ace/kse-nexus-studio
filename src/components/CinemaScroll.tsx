import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import s1 from "@/assets/scene-1-space.jpg";
import s2 from "@/assets/scene-2-clouds.jpg";
import s3 from "@/assets/scene-3-hannover-aerial.jpg";
import s4 from "@/assets/scene-4-hannover-night.jpg";
import s5 from "@/assets/scene-5-studio.jpg";
import s6 from "@/assets/scene-6-icon.jpg";

/**
 * Fullscreen fixed background that runs a 6-scene photoreal sequence
 * driven by the entire page scroll. Each scene crossfades into the next
 * with a slow Ken Burns scale, plus mild parallax + film grain on top.
 *
 * Rendered as the lowest layer; pages above sit on z-index >= 10.
 */

const SCENES: { src: string; label: string }[] = [
  { src: s1, label: "// 00 — ORBIT" },
  { src: s2, label: "// 01 — ATMOSPHÄRE" },
  { src: s3, label: "// 02 — HANNOVER · 52.37°N" },
  { src: s4, label: "// 03 — DOWNTOWN · 03:00" },
  { src: s5, label: "// 04 — STUDIO · KSE" },
  { src: s6, label: "// 05 — CHARAKTER" },
];

function Scene({
  src,
  index,
  count,
  progress,
}: {
  src: string;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  // Even windows; each scene held for ~ 1/count of total scroll, with overlap at both ends.
  const step = 1 / count;
  const start = index * step;
  const peakIn = start + step * 0.25;
  const peakOut = start + step * 0.85;
  const end = start + step;

  // First scene visible from 0, last scene holds to 1.
  const opacityStops = [
    Math.max(0, start - step * 0.15),
    peakIn,
    peakOut,
    Math.min(1, end + step * 0.05),
  ];
  const opacityValues =
    index === 0
      ? [1, 1, 1, 0]
      : index === count - 1
        ? [0, 1, 1, 1]
        : [0, 1, 1, 0];

  const opacity = useTransform(progress, opacityStops, opacityValues);
  // Scroll-driven Ken Burns: scale 1.05 → 1.22 across the scene's window
  const scale = useTransform(progress, [start, end], [1.05, 1.22]);
  // Scroll-driven vertical drift
  const y = useTransform(progress, [start, end], ["-2%", "2%"]);
  // Scroll-driven horizontal pan (alternates direction per scene)
  const xDir = index % 2 === 0 ? ["-1.5%", "1.5%"] : ["1.5%", "-1.5%"];
  const x = useTransform(progress, [start, end], xDir);

  // Continuous ambient motion (independent of scroll) — keeps the
  // scene "alive" even when the user pauses scrolling. Slow, looping.
  const ambient = {
    scale: [1, 1.04, 1],
    x: ["0%", index % 2 === 0 ? "0.8%" : "-0.8%", "0%"],
    y: ["0%", "-0.6%", "0%"],
  };
  const ambientDuration = 18 + (index % 3) * 4;

  return (
    <motion.div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        willChange: "opacity, transform",
      }}
    >
      {/* Outer = scroll-driven Ken Burns */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          scale,
          x,
          y,
          willChange: "transform",
        }}
      >
        {/* Inner = continuous ambient drift, loops forever */}
        <motion.div
          animate={ambient}
          transition={{
            duration: ambientDuration,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
          style={{
            position: "absolute",
            inset: "-4%",
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            willChange: "transform",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export function CinemaScroll() {
  // Whole-page scroll progress (0 → 1 from top of document to bottom).
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.4,
  });

  // Live scene label (top-right HUD)
  const labelIndex = useTransform(progress, (v) =>
    Math.min(SCENES.length - 1, Math.floor(v * SCENES.length)),
  );

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {/* Scene stack */}
      <div style={{ position: "absolute", inset: 0 }}>
        {SCENES.map((sc, i) => (
          <Scene
            key={i}
            src={sc.src}
            index={i}
            count={SCENES.length}
            progress={progress}
          />
        ))}
      </div>

      {/* Global vignette — keeps centered text readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Top + bottom edge scrims for header/ticker legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Subtle film grain via SVG */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.08,
          mixBlendMode: "overlay",
        }}
      >
        <filter id="cine-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cine-grain)" />
      </svg>

      {/* HUD — live scene label */}
      <SceneHud progress={progress} index={labelIndex} />
    </div>
  );
}

function SceneHud({
  progress,
  index,
}: {
  progress: MotionValue<number>;
  index: MotionValue<number>;
}) {
  const pct = useTransform(progress, (v) => String(Math.round(v * 100)).padStart(3, "0"));
  const label = useTransform(index, (i) => SCENES[i]?.label ?? SCENES[0].label);
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 4,
        fontFamily: "Inter, sans-serif",
        fontSize: 10,
        letterSpacing: "0.4em",
        textTransform: "uppercase",
        color: "#e8ff00",
        mixBlendMode: "difference",
        zIndex: 2,
      }}
    >
      <motion.span>{label}</motion.span>
      <motion.span style={{ color: "rgba(240,237,232,0.55)" }}>
        <motion.span>{pct}</motion.span> / 100
      </motion.span>
    </div>
  );
}