import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useRouterState } from "@tanstack/react-router";
import { X, Trophy, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

/** All hidden spidey IDs living across the site. */
export const EGG_IDS = [
  "hero-corner",
  "leistungen-title",
  "team-footer",
  "konfigurator-price",
  "audit-cta",
] as const;

export type EggId = (typeof EGG_IDS)[number];

type Ctx = {
  found: EggId[];
  total: number;
  find: (id: EggId) => void;
  reset: () => void;
};

const Ctx = createContext<Ctx | null>(null);
const STORAGE = "kse_egg_hunt_v1";

export function EasterEggProvider({ children }: { children: React.ReactNode }) {
  const [found, setFound] = useState<EggId[]>([]);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setFound(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(found));
    } catch {
      /* ignore */
    }
    if (found.length === EGG_IDS.length) {
      const seen = localStorage.getItem("kse_egg_reward_seen");
      if (!seen) {
        setShowReward(true);
        localStorage.setItem("kse_egg_reward_seen", "1");
        trackEvent("egg_hunt_completed");
      }
    }
  }, [found]);

  const find = useCallback((id: EggId) => {
    setFound((prev) => {
      if (prev.includes(id)) return prev;
      trackEvent("egg_found", { id, total: prev.length + 1 });
      return [...prev, id];
    });
  }, []);

  const reset = useCallback(() => {
    setFound([]);
    localStorage.removeItem("kse_egg_reward_seen");
  }, []);

  const value = useMemo(
    () => ({ found, total: EGG_IDS.length, find, reset }),
    [found, find, reset],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <HuntHUD />
      <AnimatePresence>
        {showReward && <RewardModal onClose={() => setShowReward(false)} />}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useEggHunt() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEggHunt outside provider");
  return c;
}

/** Small floating badge — bottom-right (opposite the live visitor badge). */
function HuntHUD() {
  const { found, total, reset } = useEggHunt();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideOn =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/auth";
  if (found.length === 0 || hideOn) return null;
  const pct = Math.round((found.length / total) * 100);
  return (
    <div className="fixed right-3 sm:right-4 bottom-3 sm:bottom-4 z-[55]">
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white px-3 py-1.5 text-[11px] sm:text-xs font-semibold shadow-lg border border-white/10 hover:scale-105 transition-transform"
        aria-label="Egg-Hunt Fortschritt"
      >
        <span aria-hidden>🕷️</span>
        <span className="tabular-nums">
          {found.length}/{total}
        </span>
        <span className="hidden sm:inline opacity-80">Spidey gefunden</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-full right-0 mb-2 w-64 rounded-2xl bg-black text-white p-4 shadow-2xl border border-white/10"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-display font-semibold text-sm">
                🕷️ Spidey-Hunt
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white"
                aria-label="Schließen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className="h-full bg-gradient-to-r from-red-500 to-orange-400"
              />
            </div>
            <p className="text-[11px] leading-snug text-white/70 mb-3">
              Finde alle {total} versteckten Spideys auf der Seite und schalte
              ein Geschenk frei. Klick auf jeden, den du siehst.
            </p>
            <button
              onClick={reset}
              className="text-[10px] text-white/40 hover:text-white/80 underline underline-offset-2"
            >
              Zurücksetzen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RewardModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-orange-600 text-white p-8 shadow-2xl border-2 border-yellow-300/40"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
            className="text-6xl mb-3"
          >
            🕸️
          </motion.div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest bg-yellow-300/20 border border-yellow-300/40 text-yellow-100 rounded-full px-3 py-1 mb-3">
            <Trophy className="w-3.5 h-3.5" /> Alle 5 gefunden
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">
            With great power…
          </h2>
          <p className="text-white/90 text-sm mb-6 leading-relaxed">
            Respekt, echter Held. 🕷️ Du hast alle versteckten Spideys entdeckt.
            Dafür schenken wir dir ein{" "}
            <b className="underline decoration-yellow-300 decoration-2 underline-offset-2">
              kostenloses 30-Minuten Audit
            </b>{" "}
            deiner Website oder deines Projekts.
          </p>
          <Link
            to="/audit"
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-white text-red-700 font-semibold rounded-full px-6 py-3 hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4" /> Audit einlösen
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Renders a tiny clickable spider at the given position. Position is up
 *  to the parent; wrap it in a `relative` container. */
export function HiddenSpidey({
  id,
  className = "",
  size = 22,
  title = "Du hast einen Spidey gefunden!",
}: {
  id: EggId;
  className?: string;
  size?: number;
  title?: string;
}) {
  const { found, find } = useEggHunt();
  const isFound = found.includes(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        find(id);
      }}
      aria-label="Versteckter Spidey"
      title={isFound ? "Bereits gefunden" : title}
      className={`inline-grid place-items-center rounded-full transition-all ${
        isFound
          ? "opacity-100 scale-110"
          : "opacity-30 hover:opacity-100 hover:scale-125"
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.9, lineHeight: 1 }}
    >
      <span aria-hidden className={isFound ? "grayscale-0" : ""}>
        {isFound ? "✅" : "🕷️"}
      </span>
    </button>
  );
}