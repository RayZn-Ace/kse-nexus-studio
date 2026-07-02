import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "kse_intro_shown";

/**
 * Fullscreen boot-intro (Active-Theory-style): wordmark scales/fades/blurs
 * in with a chromatic glitch burst and a bottom-centred boot counter
 * (0 → 100), then the whole overlay slides up. Never locks body scroll —
 * doing so would corrupt global scroll-height measurements used elsewhere.
 */
export function Intro() {
  const [show, setShow] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    setShow(true);

    const duration = r ? 700 : 2300;
    const t = window.setTimeout(() => setShow(false), duration);

    let raf = 0;
    if (!r) {
      const start = performance.now();
      const COUNT_MS = 1600;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / COUNT_MS);
        const eased = 1 - (1 - p) * (1 - p);
        setCount(Math.round(eased * 100));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          aria-hidden
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "#050506" }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }
              : { y: "-100%", transition: { duration: 0.9, ease: [0.77, 0, 0.175, 1] } }
          }
        >
          <motion.div
            className="relative text-center"
            initial={{ opacity: 0, scale: 0.82, filter: "blur(14px)" }}
            animate={
              reduced
                ? { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.3 } }
                : {
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
                  }
            }
          >
            <div className="relative">
              {!reduced && (
                <>
                  <motion.span
                    aria-hidden
                    className="font-black block leading-[0.9] absolute inset-0"
                    style={{
                      fontSize: "clamp(2.5rem, 9vw, 8rem)",
                      letterSpacing: "-0.05em",
                      color: "#4f7dff",
                      mixBlendMode: "screen",
                    }}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 0.7, 0, 0.45, 0], x: [0, -4, 2, -2, 0] }}
                    transition={{ delay: 1.05, duration: 0.32, ease: "linear" }}
                  >
                    KSE / GROUP
                  </motion.span>
                  <motion.span
                    aria-hidden
                    className="font-black block leading-[0.9] absolute inset-0"
                    style={{
                      fontSize: "clamp(2.5rem, 9vw, 8rem)",
                      letterSpacing: "-0.05em",
                      color: "#ff4d5e",
                      mixBlendMode: "screen",
                    }}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: [0, 0.7, 0, 0.45, 0], x: [0, 4, -2, 2, 0] }}
                    transition={{ delay: 1.05, duration: 0.32, ease: "linear" }}
                  >
                    KSE / GROUP
                  </motion.span>
                </>
              )}
              <span
                className="font-black block leading-[0.9] relative"
                style={{
                  fontSize: "clamp(2.5rem, 9vw, 8rem)",
                  letterSpacing: "-0.05em",
                  color: "#f0ede8",
                }}
              >
                KSE / GROUP
              </span>
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-4 block text-[10px] md:text-[11px] tracking-[0.5em] uppercase"
              style={{ color: "#a855f7" }}
            >
              Creative Tech Studio
            </motion.span>
          </motion.div>
          {!reduced && (
            <span
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.4em] text-white/50"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              // {String(count).padStart(3, "0")}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}