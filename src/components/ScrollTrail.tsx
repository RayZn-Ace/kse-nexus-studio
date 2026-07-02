import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Glowing organic energy strand that runs the full height of its parent
 * `relative` wrapper. The route is hinted with a faint white track, the
 * coloured stroke draws in sync with scroll, and a wandering HTML energy
 * head rides the front of the drawn portion.
 */
export function ScrollTrail({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetRef.current || !pathRef.current || !glowRef.current || !headRef.current) return;
    const path = pathRef.current;
    const glow = glowRef.current;
    const head = headRef.current;
    const length = path.getTotalLength();
    gsap.set([path, glow], { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(head, { opacity: 0, left: "50%", top: "0%" });

    const st = ScrollTrigger.create({
      trigger: targetRef.current,
      start: "top center",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        const progress = self.progress;
        const offset = length * (1 - progress);
        gsap.set(path, { strokeDashoffset: offset });
        gsap.set(glow, { strokeDashoffset: offset });
        const pt = path.getPointAtLength(length * progress);
        gsap.set(head, {
          left: pt.x / 2 + "%",
          top: pt.y / 20 + "%",
          opacity: progress > 0.005 && progress < 0.995 ? 1 : 0,
        });
      },
    });

    return () => st.kill();
  }, [targetRef]);

  return (
    <>
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
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 100 0 C 160 140, 40 260, 100 400 C 160 540, 40 660, 100 800 C 160 940, 40 1060, 100 1200 C 160 1340, 40 1460, 100 1600 C 150 1720, 60 1860, 100 2000"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.06"
        />
        <path
          ref={glowRef}
          d="M 100 0 C 160 140, 40 260, 100 400 C 160 540, 40 660, 100 800 C 160 940, 40 1060, 100 1200 C 160 1340, 40 1460, 100 1600 C 150 1720, 60 1860, 100 2000"
          fill="none"
          stroke="url(#trailGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
          filter="url(#trailGlow)"
        />
        <path
          ref={pathRef}
          d="M 100 0 C 160 140, 40 260, 100 400 C 160 540, 40 660, 100 800 C 160 940, 40 1060, 100 1200 C 160 1340, 40 1460, 100 1600 C 150 1720, 60 1860, 100 2000"
          fill="none"
          stroke="url(#trailGradient)"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <div
        ref={headRef}
        aria-hidden
        className="absolute w-28 h-28 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 60%)",
        }}
      >
        <span
          className="block"
          style={{
            width: 2,
            height: 2,
            background: "#ffffff",
            boxShadow:
              "0 0 12px 3px rgba(168,85,247,0.9), 0 0 32px 10px rgba(79,125,255,0.45)",
          }}
        />
      </div>
    </>
  );
}