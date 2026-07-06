import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [variant, setVariant] = useState<"default" | "hover" | "tile">("default");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
  }, []);

  if (!enabled) return null;

  const ringSize =
    variant === "tile" ? 64 : variant === "hover" ? 44 : 28;
  const showArrow = variant === "tile";

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[80] grid place-items-center rounded-full border-2 border-[#0a0a0a] mix-blend-difference transition-[width,height,background-color] duration-200 ease-out"
        style={{
          width: ringSize,
          height: ringSize,
          backgroundColor: variant === "tile" ? "#ff5722" : "transparent",
          borderColor: variant === "tile" ? "#ff5722" : "#ffffff",
        }}
      >
        {showArrow && (
          <span className="text-white font-black text-sm select-none" style={{ fontFamily: "var(--font-display)" }}>
            →
          </span>
        )}
      </div>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[81] h-1.5 w-1.5 rounded-full bg-white mix-blend-difference"
      />
    </>
  );
}