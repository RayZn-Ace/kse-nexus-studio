import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "kse_intro_shown";

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

    // lock scroll while intro plays
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const duration = r ? 700 : 2100;
    const t = window.setTimeout(() => {
      setShow(false);
      document.body.style.overflow = prev;
    }, duration);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          aria-hidden
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "#050505" }}
          initial={{ y: 0 }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }
              : { y: "-100%", transition: { duration: 0.9, ease: [0.77, 0, 0.175, 1] } }
          }
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              reduced
                ? { opacity: 1, scale: 1, transition: { duration: 0.3 } }
                : {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
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
            <span
              className="mt-4 block text-[10px] md:text-[11px] tracking-[0.5em] uppercase"
              style={{ color: "#e8ff00" }}
            >
              Independent Studio
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}