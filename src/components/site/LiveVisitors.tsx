import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";

// Frontend-only "social-proof" widget. Fake but plausible numbers that
// wobble slowly so it feels alive without being obviously scripted.
const CITIES = [
  { flag: "🇩🇪", name: "München" },
  { flag: "🇩🇪", name: "Berlin" },
  { flag: "🇩🇪", name: "Hamburg" },
  { flag: "🇦🇹", name: "Wien" },
  { flag: "🇨🇭", name: "Zürich" },
  { flag: "🇳🇱", name: "Amsterdam" },
  { flag: "🇪🇸", name: "Barcelona" },
  { flag: "🇬🇧", name: "London" },
];

function randomVisitors() {
  // biased around ~14, range 8-26
  const base = 14 + Math.round((Math.random() - 0.5) * 10);
  return Math.max(8, Math.min(26, base));
}

export function LiveVisitors() {
  const [count, setCount] = useState(() => randomVisitors());
  const [cityIdx, setCityIdx] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const t1 = setInterval(() => {
      setCount((c) => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        const n = c + delta;
        return Math.max(8, Math.min(26, n));
      });
    }, 4200);
    const t2 = setInterval(() => {
      setCityIdx((i) => (i + 1) % CITIES.length);
    }, 3800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const city = CITIES[cityIdx];

  return (
    <div className="fixed left-3 sm:left-4 bottom-3 sm:bottom-4 z-[55] pointer-events-none">
      <motion.button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="pointer-events-auto group flex items-center gap-2 rounded-full bg-black/85 backdrop-blur-md text-white pl-2.5 pr-3 py-1.5 text-[11px] sm:text-xs font-medium shadow-lg border border-white/10 hover:bg-black transition-colors"
        aria-label="Live-Besucher anzeigen"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Radio className="w-3 h-3 opacity-70 hidden sm:block" />
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.span
              key="full"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden"
            >
              <span className="tabular-nums font-semibold">{count}</span>
              <span className="opacity-80">gerade live</span>
              <span className="hidden sm:inline opacity-60">·</span>
              <span className="hidden sm:inline">
                {city.flag} {city.name}
              </span>
            </motion.span>
          ) : (
            <motion.span
              key="short"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tabular-nums font-semibold"
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}