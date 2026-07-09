import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [variant, setVariant] = useState<"default" | "hover" | "tile">("default");
  const [enabled, setEnabled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const disabled = pathname.startsWith("/kseadsio");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (disabled) {
      setEnabled(false);
      document.documentElement.classList.remove("kse-has-cursor");
      return;
    }
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFine || prefersReduced) return;
    setEnabled(true);

    let rx = -100, ry = -100, dx = -100, dy = -100;

    const onMove = (e: MouseEvent) => {
      dx = e.clientX;
      dy = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
      }
    };
    const raf = () => {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(raf);
    };
    let frame = requestAnimationFrame(raf);

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tile = el.closest(".brutal-tile");
      const link = el.closest("a,button,[role=button],input,textarea,select,label");
      if (tile) setVariant("tile");
      else if (link) setVariant("hover");
      else setVariant("default");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.documentElement.classList.add("kse-has-cursor");

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.classList.remove("kse-has-cursor");
    };
  }, [disabled]);

  if (!enabled || disabled) return null;

  const isTile = variant === "tile";
  const isHover = variant === "hover";
  const ringSize = isTile ? 40 : isHover ? 22 : 14;

  return (
    <>
      {/* Trailing thin ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[80] grid place-items-center rounded-full mix-blend-difference transition-[width,height,border-color,opacity] duration-200 ease-out"
        style={{
          width: ringSize,
          height: ringSize,
          border: `1px solid ${isTile ? "#ff5722" : "rgba(255,255,255,0.85)"}`,
          opacity: isHover || isTile ? 1 : 0.7,
        }}
      >
        {isTile && (
          <span
            className="select-none leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 11,
              color: "#ff5722",
              fontWeight: 800,
            }}
          >
            →
          </span>
        )}
      </div>
      {/* Precise dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[81] rounded-full mix-blend-difference transition-[width,height,opacity] duration-150 ease-out"
        style={{
          width: isTile ? 0 : 4,
          height: isTile ? 0 : 4,
          backgroundColor: "#ffffff",
          opacity: isTile ? 0 : 1,
        }}
      />
    </>
  );
}