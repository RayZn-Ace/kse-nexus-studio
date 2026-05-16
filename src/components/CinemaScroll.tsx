import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import v1 from "@/assets/scene-1-space.mp4.asset.json";
import v2 from "@/assets/scene-2-clouds.mp4.asset.json";
import v3 from "@/assets/scene-3-hannover-aerial.mp4.asset.json";
import v4 from "@/assets/scene-4-hannover-night.mp4.asset.json";
import v5 from "@/assets/scene-5-studio.mp4.asset.json";
import v6 from "@/assets/scene-6-icon.mp4.asset.json";
import p1 from "@/assets/scene-1-space.jpg";
import p2 from "@/assets/scene-2-clouds.jpg";
import p3 from "@/assets/scene-3-hannover-aerial.jpg";
import p4 from "@/assets/scene-4-hannover-night.jpg";
import p5 from "@/assets/scene-5-studio.jpg";
import p6 from "@/assets/scene-6-icon.jpg";

/**
 * Fullscreen fixed background that runs a 6-scene photoreal sequence
 * driven by the entire page scroll. Each scene crossfades into the next
 * with a slow Ken Burns scale, plus mild parallax + film grain on top.
 *
 * Rendered as the lowest layer; pages above sit on z-index >= 10.
 */

const SCENES: { src: string; poster: string; label: string }[] = [
  { src: v1.url, poster: p1, label: "// 00 — ORBIT" },
  { src: v2.url, poster: p2, label: "// 01 — ATMOSPHÄRE" },
  { src: v3.url, poster: p3, label: "// 02 — HANNOVER · 52.37°N" },
  { src: v4.url, poster: p4, label: "// 03 — DOWNTOWN · 03:00" },
  { src: v5.url, poster: p5, label: "// 04 — STUDIO · KSE" },
  { src: v6.url, poster: p6, label: "// 05 — CHARAKTER" },
];

function Scene({
  src,
  poster,
  index,
  count,
  progress,
}: {
  src: string;
  poster: string;
  index: number;
  count: number;
  progress: MotionValue<number>;
}) {
  // Even windows; each scene held for ~ 1/count of total scroll, with overlap at both ends.
  const step = 1 / count;
  const start = index * step;
  // Wide crossfade — each scene fades in/out over ~60% of its window,
  // so adjacent scenes are always blending into each other (no hard cuts).
  const peakIn = start + step * 0.6;
  const peakOut = start + step * 0.4 + step; // extends into next scene
  const end = start + step * 1.6;

  const fadeIn = start - step * 0.6;
  const fadeOut = start + step * 1.6;
  const opacityStops = [fadeIn, start + step * 0.5, fadeOut];
  const opacityValues =
    index === 0
      ? [1, 1, 0]
      : index === count - 1
        ? [0, 1, 1]
        : [0, 1, 0];

  const opacity = useTransform(progress, opacityStops, opacityValues);
  // Gentle continuous scale across the full visible window
  const scale = useTransform(progress, [fadeIn, fadeOut], [1.05, 1.15]);
  const y = useTransform(progress, [fadeIn, fadeOut], ["-1.5%", "1.5%"]);

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
      {/* Background video — continuously animated, loops forever */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          scale,
          y,
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
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
            poster={sc.poster}
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