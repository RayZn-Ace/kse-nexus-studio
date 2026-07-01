import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "kse_intro_shown";

/**
 * Fullscreen intro: wordmark scales/fades/blurs in, holds briefly, then the
 * whole overlay slides up to reveal the page underneath. Deliberately does
 * NOT lock body scroll (would corrupt global scroll-height measurements used
 * by the rest of the page) — the fixed, opaque overlay already blocks
 * interaction for its ~2s lifetime, which is enough.
 */
export function Intro() {
  const [show, setShow] = useState(false);
  const [reduced, setReduced] = useState(false);

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

    const duration = r ? 700 : 2000;
    const t = window.setTimeout(() => setShow(false), duration);
    return () => window.clearTimeout(t);
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
            className="text-center"
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
            <span
              className="font-black block leading-[0.9]"
              style={{
                fontSize: "clamp(2.5rem, 9vw, 8rem)",
                letterSpacing: "-0.05em",
                color: "#f0ede8",
              }}
            >
              KSE / GROUP
            </span>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}