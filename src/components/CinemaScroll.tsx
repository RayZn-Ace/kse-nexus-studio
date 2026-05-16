import { useScroll, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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

const SCRUB_VIDEO_SRC = "/drone-flight-scrub.mp4";
const VIDEO_FPS = 18;

export function CinemaScroll() {
  const { scrollYProgress } = useScroll();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const durationRef = useRef(10.041667);
  const pendingProgressRef = useRef(0);
  const lastTimeRef = useRef(-1);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  const flushSeek = () => {
    rafRef.current = null;
    const video = videoRef.current;
    if (!video || !ready) return;

    const duration = Number.isFinite(video.duration) ? video.duration : durationRef.current;
    const maxTime = Math.max(0, duration - 0.05);
    const frame = 1 / VIDEO_FPS;
    const target = Math.round(pendingProgressRef.current * maxTime * VIDEO_FPS) / VIDEO_FPS;
    const clamped = Math.max(0, Math.min(maxTime, target));

    if (Math.abs(lastTimeRef.current - clamped) >= frame * 0.75) {
      try {
        video.currentTime = clamped;
        lastTimeRef.current = clamped;
      } catch {}
    }
  };

  const scheduleSeek = (progress: number) => {
    pendingProgressRef.current = progress;
    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(flushSeek);
    }
  };

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    scheduleSeek(progress);

    const hud = hudRef.current;
    if (hud) {
      const pct = String(Math.round(progress * 100)).padStart(3, "0");
      const label = LABELS[Math.min(LABELS.length - 1, Math.floor(progress * LABELS.length))];
      hud.dataset.label = label;
      hud.dataset.pct = pct;
    }
  });

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
        <video
          ref={videoRef}
          src={SCRUB_VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            durationRef.current = Number.isFinite(v.duration) ? v.duration : durationRef.current;
            v.pause();
            setReady(true);
            scheduleSeek(scrollYProgress.get());
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.035)",
          }}
        />

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
      <div ref={hudRef} className="cinema-hud" data-label={LABELS[0]} data-pct="000" />
    </div>
  );
}
