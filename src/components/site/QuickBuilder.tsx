import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

type Module = {
  id: string;
  label: string;
  desc: string;
  price: [number, number];
  weeks: number;
  icon: string;
};

const MODULES: Module[] = [
  { id: "web",       label: "Website",     desc: "Design + Build",          price: [6000, 25000],  weeks: 4, icon: "◐" },
  { id: "software",  label: "Software",    desc: "Web-App / SaaS / Tool",   price: [12000, 60000], weeks: 8, icon: "◧" },
  { id: "ai",        label: "AI-Automation", desc: "Agents · Workflows",    price: [8000, 40000],  weeks: 6, icon: "◔" },
  { id: "marketing", label: "Marketing",   desc: "SEO · Ads · Content",     price: [3000, 15000],  weeks: 3, icon: "◑" },
  { id: "branding",  label: "Branding",    desc: "Identity · Design-System",price: [4000, 18000],  weeks: 3, icon: "◕" },
];

const SPEED = [
  { id: "chill",  label: "Chill",  mult: 0.95, weeksAdd: 2, desc: "Wir nehmen uns Zeit" },
  { id: "normal", label: "Normal", mult: 1.0,  weeksAdd: 0, desc: "Standard-Timeline" },
  { id: "asap",   label: "ASAP",   mult: 1.25, weeksAdd: -1, desc: "Rush · Wochenend-Sprints" },
] as const;

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

export function QuickBuilder() {
  const [selected, setSelected] = useState<string[]>(["web", "ai"]);
  const [speedIdx, setSpeedIdx] = useState(1);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      trackEvent("quickbuilder_toggle", { id, selected: next });
      return next;
    });
  };

  const chosen = MODULES.filter((m) => selected.includes(m.id));
  const speed = SPEED[speedIdx];

  const total = useMemo(() => {
    const lo = chosen.reduce((s, m) => s + m.price[0], 0);
    const hi = chosen.reduce((s, m) => s + m.price[1], 0);
    return {
      lo: Math.round(lo * speed.mult),
      hi: Math.round(hi * speed.mult),
    };
  }, [chosen, speed.mult]);

  const weeks = useMemo(() => {
    if (chosen.length === 0) return 0;
    // Longest module + small parallelism bonus for extras
    const maxW = Math.max(...chosen.map((m) => m.weeks));
    const extra = Math.max(0, chosen.length - 1) * 1;
    return Math.max(1, maxW + extra + speed.weeksAdd);
  }, [chosen, speed.weeksAdd]);

  return (
    <section
      id="quickbuilder"
      className="relative py-20 sm:py-28 px-4 sm:px-6 bg-black text-white overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-4">
            <Zap className="w-3 h-3" /> Live-Kalkulator
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">
            Bau dein Produkt.
            <span className="block text-white/40">In 30 Sekunden.</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-sm sm:text-base">
            Klick zusammen, was du brauchst. Preis & Timeline aktualisieren sich
            live — kein Formular, kein Sales-Talk.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Modules */}
          <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-4 sm:p-6">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-4">
              Bausteine wählen
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {MODULES.map((m) => {
                const on = selected.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={`group text-left rounded-2xl p-4 border transition-all ${
                      on
                        ? "bg-white text-black border-white shadow-lg"
                        : "bg-white/[0.02] text-white border-white/10 hover:border-white/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          {m.icon}
                        </span>
                        <span className="font-display font-semibold">
                          {m.label}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full grid place-items-center border ${
                          on
                            ? "bg-black text-white border-black"
                            : "border-white/30"
                        }`}
                      >
                        {on && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <p
                      className={`text-xs ${on ? "text-black/60" : "text-white/50"}`}
                    >
                      {m.desc} · ab {fmt(m.price[0])} €
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Speed
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SPEED.map((s, i) => {
                  const active = i === speedIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSpeedIdx(i);
                        trackEvent("quickbuilder_speed", { speed: s.id });
                      }}
                      className={`rounded-xl px-3 py-3 text-left border transition-all ${
                        active
                          ? "bg-white text-black border-white"
                          : "bg-white/[0.02] border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="font-display font-semibold text-sm">
                        {s.label}
                      </div>
                      <div
                        className={`text-[11px] ${active ? "text-black/60" : "text-white/50"}`}
                      >
                        {s.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-white/90 text-black p-6 lg:sticky lg:top-24 h-fit">
            <div className="text-xs uppercase tracking-widest text-black/40 mb-2">
              Deine Konfiguration
            </div>
            {chosen.length === 0 ? (
              <p className="text-sm text-black/50 py-4">
                Wähle links mindestens einen Baustein.
              </p>
            ) : (
              <ul className="space-y-1.5 mb-4">
                {chosen.map((m) => (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between text-sm border-b border-black/5 pb-1.5"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{m.icon}</span> {m.label}
                    </span>
                    <span className="text-black/50 text-xs tabular-nums">
                      {fmt(m.price[0])}–{fmt(m.price[1])} €
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl bg-black/5 p-3">
                <div className="text-[10px] uppercase tracking-widest text-black/40 mb-1">
                  Investment
                </div>
                <div className="font-display text-lg font-bold tabular-nums leading-tight">
                  {chosen.length ? (
                    <>
                      {fmt(total.lo)}–{fmt(total.hi)}
                      <span className="text-black/40 font-normal text-sm ml-1">
                        €
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 p-3">
                <div className="text-[10px] uppercase tracking-widest text-black/40 mb-1">
                  Timeline
                </div>
                <div className="font-display text-lg font-bold tabular-nums leading-tight">
                  {chosen.length ? (
                    <>
                      ~{weeks}
                      <span className="text-black/40 font-normal text-sm ml-1">
                        Wochen
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            <Link
              to="/konfigurator"
              onClick={() =>
                trackEvent("quickbuilder_cta", { selected, speed: speed.id })
              }
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-3 font-semibold text-sm transition-all ${
                chosen.length
                  ? "bg-black text-white hover:scale-[1.02]"
                  : "bg-black/10 text-black/40 pointer-events-none"
              }`}
            >
              Angebot anfragen <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[10px] text-black/40 text-center mt-2">
              Unverbindlich · Antwort in &lt; 24h
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}