import { useEffect, useRef, useState } from "react";

/**
 * Active-Theory-style custom cursor:
 * - default: 8px filled dot in accent yellow (#E8FF00)
 * - over clickable elements: 40px empty ring in accent yellow
 * Uses damped lerp for a smooth trailing motion.
 */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(hover: none)").matches) return;
    setMounted(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (Math.abs(target.x - pos.x) > 0.2 || Math.abs(target.y - pos.y) > 0.2) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = e.target as HTMLElement | null;
      const isInteractive = !!el?.closest(
        'a, button, [role="button"], input, textarea, select, label, [data-cursor="accent"]'
      );
      if (isInteractive !== hoverRef.current) {
        hoverRef.current = isInteractive;
        setHover(isInteractive);
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!mounted) return null;

  const size = hover ? 40 : 8;

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: "9999px",
        border: hover ? "1.5px solid #e8ff00" : "0 solid transparent",
        background: hover ? "transparent" : "#e8ff00",
        pointerEvents: "none",
        zIndex: 9999,
        transition:
          "width 260ms cubic-bezier(0.77,0,0.175,1), height 260ms cubic-bezier(0.77,0,0.175,1), background 220ms, border-width 220ms",
        willChange: "transform",
        boxShadow: hover ? "none" : "0 0 12px rgba(232,255,0,0.55)",
      }}
    />
  );
}