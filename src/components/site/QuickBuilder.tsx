import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/tracking";

type Module = {
  id: string;
  label: string;
  desc: string;
  price: [number, number];
  weeks: number;
  code: string;
};

const MODULES: Module[] = [
  { id: "web",       label: "Website",       desc: "Design + Build",          price: [6000, 25000],  weeks: 4, code: "01" },
  { id: "software",  label: "Software",      desc: "Web-App · SaaS · Tool",   price: [12000, 60000], weeks: 8, code: "02" },
  { id: "ai",        label: "AI-Automation", desc: "Agents · Workflows",      price: [8000, 40000],  weeks: 6, code: "03" },
  { id: "marketing", label: "Marketing",     desc: "SEO · Ads · Content",     price: [3000, 15000],  weeks: 3, code: "04" },
  { id: "branding",  label: "Branding",      desc: "Identity · Design-System",price: [4000, 18000],  weeks: 3, code: "05" },
];

/**
 * priceMult scales the budget; timeMult scales the base timeline.
 * Base timeline = max(module.weeks) + 0.5 * (count-1).
 *  chill  → +40% Puffer, sauberer Rhythmus, dafür 10% günstiger
 *  normal → Standard
 *  asap   → 45% schneller, dafür 40% Rush-Aufschlag
 */
const SPEED = [
  { id: "chill",  label: "Chill",  priceMult: 0.9,  timeMult: 1.4,  desc: "Puffer · sauberer Rhythmus" },
  { id: "normal", label: "Normal", priceMult: 1.0,  timeMult: 1.0,  desc: "Standard-Timeline" },
  { id: "asap",   label: "ASAP",   priceMult: 1.4,  timeMult: 0.55, desc: "Rush · parallele Squads" },
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
      lo: Math.round(lo * speed.priceMult),
      hi: Math.round(hi * speed.priceMult),
    };
  }, [chosen, speed.priceMult]);

  const weeks = useMemo(() => {
    if (chosen.length === 0) return 0;
    const maxW = Math.max(...chosen.map((m) => m.weeks));
    const base = maxW + Math.max(0, chosen.length - 1) * 0.5;
    return Math.max(2, Math.round(base * speed.timeMult));
  }, [chosen, speed.timeMult]);

  const empty = chosen.length === 0;

  return (
    <section
      id="quickbuilder"
      className="relative bg-[#f5f2ea] text-[#0a0a0a] border-y-4 border-[#0a0a0a] overflow-hidden"
    >
      {/* Faint construction grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#0a0a0a 1px, transparent 1px), linear-gradient(90deg, #0a0a0a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        {/* Header row */}
        <div className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-6 items-end mb-10 md:mb-14 border-b-2 border-[#0a0a0a] pb-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] bg-[#ff5722] text-white px-2.5 py-1 mb-4">
              <span>◆</span> Live-Kalkulator · v1.0
            </div>
            <h2
              className="font-black leading-[0.85] tracking-tighter uppercase text-[clamp(2.5rem,7vw,6rem)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Bau dein
              <br />
              <span className="text-[#ff5722]">Produkt.</span>
            </h2>
          </div>
          <div className="text-right md:text-right text-xs md:text-sm text-[#0a0a0a]/70 max-w-xs md:pb-3">
            <div className="font-black uppercase tracking-widest text-[10px] text-[#0a0a0a] mb-1">
              / So funktioniert&apos;s
            </div>
            Bausteine klicken, Speed wählen, Preis &amp; Timeline aktualisieren
            sich live. Kein Formular. Kein Sales-Talk.
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-6 lg:gap-10 items-start">
          {/* LEFT — brutalist module rack */}
          <div className="space-y-8">
            {/* Modules */}
            <div>
              <SectionLabel n="01" title="Bausteine" />
              <div className="grid sm:grid-cols-2 gap-3">
                {MODULES.map((m) => {
                  const on = selected.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggle(m.id)}
                      className={`group relative text-left border-2 border-[#0a0a0a] p-4 transition-all ${
                        on
                          ? "bg-[#0a0a0a] text-[#f5f2ea] translate-x-[3px] translate-y-[3px] shadow-none"
                          : "bg-white hover:-translate-x-[2px] hover:-translate-y-[2px]"
                      }`}
                      style={{
                        boxShadow: on ? "none" : "4px 4px 0 0 #0a0a0a",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <div
                            className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                              on ? "text-[#ff5722]" : "text-[#0a0a0a]/40"
                            }`}
                          >
                            MOD.{m.code}
                          </div>
                          <div
                            className="font-black text-xl uppercase tracking-tight leading-none truncate"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {m.label}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 w-6 h-6 border-2 border-current grid place-items-center text-[13px] font-black ${
                            on ? "bg-[#ff5722] border-[#ff5722] text-white" : ""
                          }`}
                        >
                          {on ? "✕" : "+"}
                        </div>
                      </div>
                      <p
                        className={`text-xs ${on ? "text-[#f5f2ea]/60" : "text-[#0a0a0a]/60"}`}
                      >
                        {m.desc}
                      </p>
                      <div
                        className={`mt-3 pt-2 border-t border-dashed flex items-center justify-between text-[11px] font-mono ${
                          on ? "border-[#f5f2ea]/20" : "border-[#0a0a0a]/15"
                        }`}
                      >
                        <span className={on ? "text-[#f5f2ea]/50" : "text-[#0a0a0a]/40"}>
                          ab {fmt(m.price[0])} €
                        </span>
                        <span className={on ? "text-[#f5f2ea]/50" : "text-[#0a0a0a]/40"}>
                          ~{m.weeks} Wo.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speed */}
            <div>
              <SectionLabel n="02" title="Speed-Mode" />
              <div className="grid grid-cols-3 border-2 border-[#0a0a0a] bg-white">
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
                      className={`relative text-left p-4 transition-colors border-r-2 last:border-r-0 border-[#0a0a0a] ${
                        active ? "bg-[#ff5722] text-white" : "hover:bg-[#0a0a0a]/[0.03]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-black text-2xl uppercase leading-none"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {s.label}
                        </span>
                        {active && (
                          <span className="text-[10px] font-black bg-white text-[#ff5722] px-1.5 py-0.5">
                            ●
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] leading-tight ${
                          active ? "text-white/85" : "text-[#0a0a0a]/60"
                        }`}
                      >
                        {s.desc}
                      </p>
                      <div
                        className={`mt-2 text-[10px] font-mono tabular-nums ${
                          active ? "text-white/70" : "text-[#0a0a0a]/40"
                        }`}
                      >
                        ×{s.priceMult.toFixed(2)} · ×{s.timeMult.toFixed(2)}t
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — build-order receipt */}
          <aside className="lg:sticky lg:top-24">
            <div
              className="relative bg-white border-2 border-[#0a0a0a]"
              style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
            >
              {/* ticket header */}
              <div className="bg-[#0a0a0a] text-[#f5f2ea] px-5 py-3 flex items-center justify-between">
                <div
                  className="font-black uppercase tracking-tight text-lg"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Build-Order
                </div>
                <div className="text-[10px] font-mono opacity-60">
                  #KSE-{new Date().getFullYear()}
                </div>
              </div>

              <div className="p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0a0a0a]/50 mb-3">
                  / Stack
                </div>
                {empty ? (
                  <p className="text-sm text-[#0a0a0a]/50 py-6 border-y border-dashed border-[#0a0a0a]/20 text-center">
                    Wähle mindestens einen Baustein.
                  </p>
                ) : (
                  <ul className="mb-4">
                    {chosen.map((m) => (
                      <motion.li
                        key={m.id}
                        layout
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-baseline py-2 border-b border-dashed border-[#0a0a0a]/15 last:border-b-0"
                      >
                        <span className="font-mono text-[10px] text-[#0a0a0a]/40 tabular-nums">
                          {m.code}
                        </span>
                        <span className="font-semibold text-sm truncate">
                          {m.label}
                        </span>
                        <span className="font-mono text-xs text-[#0a0a0a]/60 tabular-nums whitespace-nowrap">
                          {fmt(m.price[0])}–{fmt(m.price[1])} €
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {/* Speed badge */}
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                  <span className="text-[#0a0a0a]/50">/ Speed</span>
                  <span className="bg-[#ff5722] text-white px-2 py-0.5">
                    {speed.label}
                  </span>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 border-2 border-[#0a0a0a] mb-5">
                  <div className="p-3 border-r-2 border-[#0a0a0a]">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/50 mb-1">
                      Investment
                    </div>
                    <div
                      className="font-black text-2xl leading-none tabular-nums"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {empty ? (
                        "—"
                      ) : (
                        <>
                          {fmt(total.lo)}
                          <span className="text-[#0a0a0a]/30">–</span>
                          {fmt(total.hi)}
                          <span className="text-sm ml-0.5 font-bold">€</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-[#f5f2ea]">
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/50 mb-1">
                      Timeline
                    </div>
                    <div
                      className="font-black text-2xl leading-none tabular-nums"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {empty ? (
                        "—"
                      ) : (
                        <>
                          {weeks}
                          <span className="text-sm ml-1 font-bold">Wo.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  to="/konfigurator"
                  onClick={() =>
                    trackEvent("quickbuilder_cta", {
                      selected,
                      speed: speed.id,
                    })
                  }
                  className={`group w-full inline-flex items-center justify-between gap-2 border-2 border-[#0a0a0a] px-5 py-4 font-black uppercase tracking-wide text-sm transition-all ${
                    empty
                      ? "bg-[#0a0a0a]/5 text-[#0a0a0a]/30 pointer-events-none"
                      : "bg-[#ff5722] text-white hover:bg-[#0a0a0a]"
                  }`}
                >
                  Angebot anfragen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-[10px] text-[#0a0a0a]/50 text-center mt-3 font-mono tracking-wide">
                  ● unverbindlich · antwort in &lt; 24h
                </p>
              </div>

              {/* faux barcode */}
              <div className="border-t-2 border-[#0a0a0a] px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex gap-0.5 items-end h-6 flex-1 overflow-hidden">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <span
                      key={i}
                      className="bg-[#0a0a0a] block"
                      style={{
                        width: (i * 7) % 3 === 0 ? 2 : 1,
                        height: `${60 + ((i * 13) % 40)}%`,
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-[#0a0a0a]/50">
                  KSE/QB
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-mono text-[11px] font-bold text-[#ff5722]">
        [{n}]
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]">
        {title}
      </span>
      <span className="flex-1 h-px bg-[#0a0a0a]/20" />
    </div>
  );
}