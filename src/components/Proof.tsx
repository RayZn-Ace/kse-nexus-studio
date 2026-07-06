import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const STATS: Stat[] = [
  { value: 50, suffix: "+", label: "Projekte umgesetzt", color: "#4f7dff" },
  { value: 5, suffix: "", label: "Jahre am Markt", color: "#a855f7" },
  { value: 12, suffix: " Mio.+", label: "Erzielte Reichweite", color: "#ff4d5e" },
  { value: 100, suffix: "%", label: "Inhabergeführt", color: "#f0ede8" },
];

function CountUp({ target, duration = 1400 }: { target: number; duration?: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, reduced]);

  return <span ref={ref}>{value}</span>;
}

export function Proof() {
  return (
    <section className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
      <div className="max-w-7xl mx-auto">
        <span className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-16">
          / 03 — In Zahlen
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          {STATS.map((s) => (
            <div key={s.label} data-reveal>
              <div
                className="font-black leading-[0.9]"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  letterSpacing: "-0.04em",
                  color: s.color,
                }}
              >
                <CountUp target={s.value} />
                <span>{s.suffix}</span>
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-[0.4em] text-white/40">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}