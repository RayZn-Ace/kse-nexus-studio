import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor: large 48px ring that lerps after the mouse and shrinks to
 * a 12px filled dot over interactive elements. Switches to the brand
 * accent (#e8ff00) on links / CTAs / [data-cursor="accent"].
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<"default" | "link" | "hover">("default");
  const [mounted, setMounted] = useState(false);
  const [hovering, setHovering] = useState<"default" | "link" | "hover">("default");

  useEffect(() => {
    // Skip on touch devices
    if (typeof window === "undefined" || window.matchMedia("(hover: none)").matches) return;
    setMounted(true);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;

    const setHover = (next: "default" | "link" | "hover") => {
      if (hoverRef.current === next) return;
      hoverRef.current = next;
      setHovering(next);
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.closest('a, button, [role="button"], [data-cursor="accent"]')) {
        setHover(el.closest('a, [data-cursor="accent"]') ? "link" : "hover");
      } else {
        setHover("default");
      }
      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!mounted) return null;

  const size = hovering === "default" ? 48 : 12;
  const bg = hovering === "default" ? "transparent" : hovering === "link" ? "#e8ff00" : "#f0ede8";
  const border = hovering === "link" ? "#e8ff00" : "#f0ede8";

  return (
    <div
      ref={ringRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: "9999px",
        border: `1.5px solid ${border}`,
        background: bg,
        pointerEvents: "none",
        zIndex: 9999,
        mixBlendMode: "difference",
        transition: "width 220ms cubic-bezier(0.77,0,0.175,1), height 220ms cubic-bezier(0.77,0,0.175,1), background 220ms, border-color 220ms",
        willChange: "transform",
      }}
    />
  );
}