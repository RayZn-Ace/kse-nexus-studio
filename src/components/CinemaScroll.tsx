import { useEffect, useRef } from "react";

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

const FRAME_COUNT = 312;

const getFrameSrc = (frame: number) =>
  `/cinema-frames/frame-${String(frame).padStart(4, "0")}.webp`;

export function CinemaScroll() {
  const rafRef = useRef<number | null>(null);
  const pendingProgressRef = useRef(0);
  const lastFrameRef = useRef(1);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);

  const readScrollProgress = () => {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    return Math.max(0, Math.min(1, window.scrollY / max));
  };

  const flushSeek = () => {
    rafRef.current = null;
    const img = imageRef.current;
    if (!img) return;

    const frame = Math.max(1, Math.min(FRAME_COUNT, Math.round(1 + pendingProgressRef.current * (FRAME_COUNT - 1))));

    if (lastFrameRef.current !== frame) {
      img.src = getFrameSrc(frame);
      lastFrameRef.current = frame;
    }
  };

  const scheduleSeek = (progress: number) => {
    pendingProgressRef.current = progress;
    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(flushSeek);
    }
  };

  useEffect(() => {
    const updateFromScroll = () => {
      const progress = readScrollProgress();
      scheduleSeek(progress);

      const hud = hudRef.current;
      if (hud) {
        const pct = String(Math.round(progress * 100)).padStart(3, "0");
        const label = LABELS[Math.min(LABELS.length - 1, Math.floor(progress * LABELS.length))];
        hud.dataset.label = label;
        hud.dataset.pct = pct;
      }
    };

    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);

    [1, 35, 70, 105, 140, 175, 210, 245, 280, 312].forEach((frame) => {
      const image = new Image();
      image.src = getFrameSrc(frame);
    });

    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
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
        <img
          ref={imageRef}
          src={getFrameSrc(1)}
          alt=""
          draggable={false}
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
