import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * A single glowing organic strand that runs the full height of its parent
 * (position it inside a `relative` wrapper spanning the section(s) it should
 * trail through). The stroke draws in sync with scroll progress through that
 * wrapper, with a soft trailing glow-blur. Color drifts blue -> violet -> red.
 */
export function ScrollTrail({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!targetRef.current || !pathRef.current || !glowRef.current) return;
    const path = pathRef.current;
    const glow = glowRef.current;
    const length = path.getTotalLength();
    gsap.set([path, glow], { strokeDasharray: length, strokeDashoffset: length });

    const st = ScrollTrigger.create({
      trigger: targetRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const offset = length * (1 - self.progress);
        gsap.set(path, { strokeDashoffset: offset });
        gsap.set(glow, { strokeDashoffset: offset });
      },
    });

    return () => st.kill();
  }, [targetRef]);

  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 200 2000"
      preserveAspectRatio="none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="trailGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f7dff" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ff4d5e" />
        </linearGradient>
        <filter id="trailGlow" x="-100%" y="-20%" width="300%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        ref={glowRef}
        d="M 100 0 C 160 140, 40 260, 100 400 C 160 540, 40 660, 100 800 C 160 940, 40 1060, 100 1200 C 160 1340, 40 1460, 100 1600 C 150 1720, 60 1860, 100 2000"
        fill="none"
        stroke="url(#trailGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
        filter="url(#trailGlow)"
      />
      <path
        ref={pathRef}
        d="M 100 0 C 160 140, 40 260, 100 400 C 160 540, 40 660, 100 800 C 160 940, 40 1060, 100 1200 C 160 1340, 40 1460, 100 1600 C 150 1720, 60 1860, 100 2000"
        fill="none"
        stroke="url(#trailGradient)"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}