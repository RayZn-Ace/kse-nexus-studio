import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import flight from "@/assets/drone-flight.mp4.asset.json";

/**
 * Fullscreen fixed background: ONE continuous drone flight video
 * (space → atmosphere → Hannover → studio) scroll-scrubbed across the
 * entire page. No cuts, no crossfades — one smooth take that only
 * advances while the user scrolls.
 */

const LABELS = [
  "// 00 — ORBIT",
  "// 01 — ATMOSPHÄRE",
  "// 02 — HANNOVER · 52.37°N",
  "// 03 — DOWNTOWN",
  "// 04 — STUDIO · KSE",
  "// 05 — CHARAKTER",
];

export function CinemaScroll() {
  const { scrollYProgress } = useScroll();
  // Heavy smoothing so the scrub feels like a slow, weighted drone gimbal.
  const progress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 30,
    mass: 0.6,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  // Track scroll-target time
  useMotionValueEvent(progress, "change", (p) => {
    const v = videoRef.current;
    if (!v || !ready) return;
    const dur = v.duration;
    if (!dur || !isFinite(dur)) return;
    targetTimeRef.current = Math.max(0, Math.min(dur - 0.05, p * (dur - 0.05)));
  });

  // RAF loop: ease video.currentTime toward target for buttery motion.
  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        const cur = v.currentTime;
        const target = targetTimeRef.current;
        const diff = target - cur;
        if (Math.abs(diff) > 0.005) {
          // Lerp toward target; small step = silky smooth.
          v.currentTime = cur + diff * 0.18;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const labelIndex = useTransform(progress, (v) =>
    Math.min(LABELS.length - 1, Math.floor(v * LABELS.length)),
  );

  // Subtle scale push across the full scroll for extra depth
  const scale = useTransform(progress, [0, 1], [1.04, 1.1]);

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
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          scale,
          willChange: "transform",
        }}
      >
        <video
          ref={videoRef}
          src={flight.url}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            v.pause();
            v.currentTime = 0;
            setReady(true);
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </motion.div>

      {/* Global vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Top + bottom edge scrims */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Film grain */}
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

      <SceneHud progress={progress} index={labelIndex} />
    </div>
  );
}

function SceneHud({
  progress,
  index,
}: {
  progress: ReturnType<typeof useSpring>;
  index: ReturnType<typeof useTransform<number, number>>;
}) {
  const pct = useTransform(progress, (v: number) =>
    String(Math.round(v * 100)).padStart(3, "0"),
  );
  const label = useTransform(index, (i: number) => LABELS[i] ?? LABELS[0]);
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
