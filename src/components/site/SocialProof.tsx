import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Zap, Users, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";

type Event = {
  icon: typeof Sparkles;
  text: string;
  time: string;
};

const CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt",
  "Hannover", "Bremen", "Leipzig", "Düsseldorf", "Stuttgart",
  "Zürich", "Wien", "Salzburg", "Dortmund", "Nürnberg",
];

const INDUSTRIES = [
  "Zahnarztpraxis", "Restaurant", "Handwerksbetrieb", "SaaS-Startup",
  "Steuerkanzlei", "Boutique", "Immobilienmakler", "Physiotherapie",
  "Café", "Agentur", "Coach", "Autohaus",
];

const TIME_LABELS = [
  "vor 2 Min.", "vor 4 Min.", "vor 7 Min.", "vor 12 Min.",
  "vor 18 Min.", "vor 24 Min.", "vor 31 Min.", "vor 46 Min.",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvent(): Event {
  const templates = [
    () => ({
      icon: Sparkles,
      text: `${pick(INDUSTRIES)} aus ${pick(CITIES)} hat den Konfigurator ausgefüllt`,
      time: pick(TIME_LABELS),
    }),
    () => ({
      icon: Zap,
      text: `Website-Audit gestartet aus ${pick(CITIES)}`,
      time: pick(TIME_LABELS),
    }),
    () => ({
      icon: Users,
      text: `${Math.floor(Math.random() * 6) + 3} Besucher sind gerade online`,
      time: "jetzt",
    }),
    () => ({
      icon: Sparkles,
      text: `NOVA (AI-Agent) beantwortet Anfrage aus ${pick(CITIES)}`,
      time: pick(TIME_LABELS),
    }),
    () => ({
      icon: Zap,
      text: `Neues Pilot-Projekt generiert: ${pick(INDUSTRIES)}`,
      time: pick(TIME_LABELS),
    }),
  ];
  return pick(templates)();
}

const HIDDEN_ROUTES = ["/admin", "/auth", "/lab", "/audit", "/agent-swarm", "/share"];

export function SocialProof() {
  const location = useLocation();
  const [event, setEvent] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const hidden = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));

  useEffect(() => {
    if (hidden || dismissed) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("kse:social-proof-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    let alive = true;
    let showTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    function cycle(initialDelay: number) {
      showTimeout = setTimeout(() => {
        if (!alive) return;
        setEvent(generateEvent());
        hideTimeout = setTimeout(() => {
          if (!alive) return;
          setEvent(null);
          cycle(12000 + Math.random() * 8000); // 12–20s between events
        }, 6500);
      }, initialDelay);
    }

    cycle(8000); // wait 8s before first event

    return () => {
      alive = false;
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [hidden, dismissed]);

  if (hidden) return null;

  function dismiss() {
    setDismissed(true);
    setEvent(null);
    try {
      sessionStorage.setItem("kse:social-proof-dismissed", "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {event && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-4 left-4 z-40 flex max-w-xs items-start gap-3 border-2 border-[#0a0a0a] bg-white p-3 pr-8 shadow-[4px_4px_0_#ff5722] md:bottom-6 md:left-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-[#0a0a0a] bg-[#ffeb3b]">
            <event.icon className="h-4 w-4 text-[#0a0a0a]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium leading-snug text-[#0a0a0a]">
              {event.text}
            </div>
            <div className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-[#ff5722]">
              {event.time}
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Ausblenden"
            className="absolute right-1.5 top-1.5 rounded-sm p-1 text-[#0a0a0a]/40 hover:bg-[#0a0a0a]/5 hover:text-[#0a0a0a]"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}