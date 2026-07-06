import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/konfigurator")({
  head: () => ({
    meta: [
      { title: "Projekt-Konfigurator — KSE GROUP" },
      {
        name: "description",
        content:
          "Konfiguriere dein Projekt in 60 Sekunden: Leistungen, Timeline, Budget. Sofortige Preis-Range & unverbindliches Angebot von KSE GROUP.",
      },
      { property: "og:title", content: "Projekt-Konfigurator — KSE GROUP" },
      {
        property: "og:description",
        content: "In 4 Schritten zum unverbindlichen Angebot — Software, AI, Web, Marketing, Branding.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: KonfiguratorPage,
});

/* ─────────────  Konfig  ───────────── */

const SERVICES = [
  { id: "software", label: "Software", desc: "Web-Apps · SaaS · Tools", icon: "◧" },
  { id: "ai", label: "AI-Automation", desc: "Agents · Workflows · Chatbots", icon: "◔" },
  { id: "web", label: "Website", desc: "High-End · Marketing-Sites · Shops", icon: "◐" },
  { id: "marketing", label: "Marketing", desc: "Performance · SEO · Content", icon: "◑" },
  { id: "branding", label: "Branding", desc: "Identity · Logo · Design-System", icon: "◕" },
];

const TIMELINES = [
  { id: "asap", label: "ASAP", desc: "Innerhalb 4 Wochen starten" },
  { id: "1-3m", label: "1–3 Monate", desc: "Konkrete Planung, kein Rush" },
  { id: "later", label: "Q2 2026+", desc: "Wir sondieren nur" },
];

const BUDGETS = [
  { id: "<10k", label: "< 10.000 €", desc: "Kleines Modul / MVP-Baustein" },
  { id: "10-30k", label: "10–30k €", desc: "Kompaktes Projekt" },
  { id: "30-80k", label: "30–80k €", desc: "Vollwertiges Produkt" },
  { id: "80k+", label: "80k+ €", desc: "Enterprise / Multi-Track" },
];

const RATE_MAP: Record<string, [number, number]> = {
  software: [12000, 60000],
  ai: [8000, 40000],
  web: [6000, 25000],
  marketing: [3000, 15000],
  branding: [4000, 18000],
};

/* ─────────────  Types  ───────────── */

type State = {
  services: string[];
  timeline: string | null;
  budget: string | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
};

const initial: State = {
  services: [],
  timeline: null,
  budget: null,
  name: "",
  company: "",
  email: "",
  phone: "",
  message: "",
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name zu kurz").max(120),
  company: z.string().trim().max(160).optional(),
  email: z.string().trim().email("Bitte gültige E-Mail").max(255),
  phone: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
});

/* ─────────────  UI Primitives  ───────────── */

function StepDot({ active, done, i }: { active: boolean; done: boolean; i: number }) {
  return (
    <div
      className={`grid place-items-center h-8 w-8 border-2 border-[#0a0a0a] text-xs font-black transition-colors ${
        done ? "bg-[#22c55e] text-white" : active ? "bg-[#ffeb3b]" : "bg-white"
      }`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {done ? "✓" : i + 1}
    </div>
  );
}

function BrutalButton({
  children,
  variant = "primary",
  disabled,
  onClick,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "yellow";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-[#0a0a0a] text-white hover:bg-[#ff5722]"
      : variant === "yellow"
      ? "bg-[#ffeb3b] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white"
      : "bg-white text-[#0a0a0a] hover:bg-[#f5f5f5]";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 border-2 border-[#0a0a0a] px-5 py-3 text-[11px] uppercase tracking-[0.2em] font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles} ${className}`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </button>
  );
}

/* ─────────────  Page  ───────────── */

function KonfiguratorPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const priceRange = useMemo(() => {
    if (!state.services.length) return null;
    let lo = 0;
    let hi = 0;
    for (const s of state.services) {
      const [a, b] = RATE_MAP[s] ?? [0, 0];
      lo += a;
      hi += b;
    }
    const factor = state.timeline === "asap" ? 1.15 : 1;
    return {
      lo: Math.round((lo * factor) / 1000) * 1000,
      hi: Math.round((hi * factor) / 1000) * 1000,
    };
  }, [state.services, state.timeline]);

  const canNext =
    (step === 0 && state.services.length > 0) ||
    (step === 1 && state.timeline) ||
    (step === 2 && state.budget) ||
    step === 3;

  const toggleService = (id: string) =>
    setState((s) => ({
      ...s,
      services: s.services.includes(id) ? s.services.filter((x) => x !== id) : [...s.services, id],
    }));

  async function submit() {
    const parsed = contactSchema.safeParse({
      name: state.name,
      company: state.company || undefined,
      email: state.email,
      phone: state.phone || undefined,
      message: state.message || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Bitte Angaben prüfen");
      return;
    }
    if (!state.services.length || !state.timeline || !state.budget) {
      toast.error("Bitte alle Schritte ausfüllen");
      return;
    }
    setSubmitting(true);

    const summary =
      `Konfigurator-Anfrage\n\n` +
      `Leistungen: ${state.services.join(", ")}\n` +
      `Timeline: ${state.timeline}\n` +
      `Budget: ${state.budget}\n` +
      (priceRange ? `Kalkulierte Range: ${priceRange.lo.toLocaleString("de-DE")} – ${priceRange.hi.toLocaleString("de-DE")} €\n` : "") +
      (state.company ? `Firma: ${state.company}\n` : "") +
      (state.phone ? `Telefon: ${state.phone}\n` : "") +
      (state.message ? `\nNachricht:\n${state.message}` : "");

    const { error } = await supabase.from("contact_messages").insert({
      name: state.name.trim(),
      email: state.email.trim(),
      message: summary,
      company: state.company.trim() || null,
      services: state.services,
      budget_range: state.budget,
      timeline: state.timeline,
      source: "konfigurator",
    });

    setSubmitting(false);
    if (error) {
      toast.error("Konnte nicht senden. Bitte E-Mail an info@ksegroup.eu.");
      return;
    }
    setDone(true);
    toast.success("Anfrage gesendet! Wir melden uns innerhalb von 24h.");
  }

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      {/* Top bar */}
      <header className="border-b-4 border-[#0a0a0a] bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <span
              className="grid place-items-center h-9 w-9 shrink-0 border-2 border-[#0a0a0a] bg-[#ff5722] text-white font-black"
              style={{ fontFamily: "var(--font-display)" }}
            >
              K
            </span>
            <span
              className="truncate font-black tracking-tighter uppercase text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              KSE GROUP
            </span>
          </Link>
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="text-[11px] uppercase tracking-[0.2em] font-bold hover:text-[#ff5722]"
          >
            ← Zurück
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-14">
        {done ? (
          <SuccessScreen state={state} priceRange={priceRange} />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8 md:mb-12">
              <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#ff5722]">
                / Projekt-Konfigurator
              </p>
              <h1
                className="mt-3 text-4xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter uppercase"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Dein Projekt.<br />In 60 Sekunden.
              </h1>
              <p className="mt-5 max-w-2xl text-base md:text-lg text-[#0a0a0a]/70">
                Vier Fragen — direkte Preis-Range und persönliche Antwort innerhalb 24h.
                Kein Verkaufsdruck, keine Newsletter-Falle.
              </p>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-3 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <StepDot i={i} active={step === i} done={step > i} />
                  {i < 3 && <div className={`h-0.5 w-6 md:w-12 ${step > i ? "bg-[#22c55e]" : "bg-[#0a0a0a]/20"}`} />}
                </div>
              ))}
              <div className="ml-auto text-[11px] uppercase tracking-[0.2em] font-bold text-[#0a0a0a]/60">
                Schritt {step + 1} / 4
              </div>
            </div>

            <div className="brutal-tile p-6 md:p-10 min-h-[440px] flex flex-col">
              <div className="flex-1">
                {step === 0 && (
                  <StepServices selected={state.services} onToggle={toggleService} />
                )}
                {step === 1 && (
                  <StepTimeline
                    value={state.timeline}
                    onChange={(v) => setState((s) => ({ ...s, timeline: v }))}
                  />
                )}
                {step === 2 && (
                  <StepBudget
                    value={state.budget}
                    onChange={(v) => setState((s) => ({ ...s, budget: v }))}
                    priceRange={priceRange}
                  />
                )}
                {step === 3 && (
                  <StepContact
                    state={state}
                    setState={setState}
                    priceRange={priceRange}
                  />
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t-2 border-[#0a0a0a]/10 pt-6">
                <BrutalButton
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  ← Zurück
                </BrutalButton>

                {step < 3 ? (
                  <BrutalButton
                    variant="yellow"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext}
                  >
                    Weiter →
                  </BrutalButton>
                ) : (
                  <BrutalButton
                    variant="primary"
                    onClick={submit}
                    disabled={submitting}
                  >
                    {submitting ? "Wird gesendet …" : "Anfrage senden →"}
                  </BrutalButton>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ─────────────  Steps  ───────────── */

function StepServices({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <StepHead label="/ 01" title="Was brauchst du?" hint="Mehrfachauswahl möglich" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {SERVICES.map((s) => {
          const active = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className={`text-left border-2 border-[#0a0a0a] p-5 transition-all ${
                active
                  ? "bg-[#0a0a0a] text-white shadow-[6px_6px_0_#ff5722]"
                  : "bg-white hover:bg-[#fffbe0]"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none" style={{ fontFamily: "var(--font-display)" }}>
                  {s.icon}
                </span>
                <span
                  className={`inline-block h-5 w-5 border-2 border-current ${
                    active ? "bg-[#ff5722] border-[#ff5722]" : ""
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div
                className="mt-4 font-black uppercase tracking-tight text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.label}
              </div>
              <div className={`mt-1 text-sm ${active ? "text-white/70" : "text-[#0a0a0a]/60"}`}>
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepTimeline({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <StepHead label="/ 02" title="Wie dringend?" hint="ASAP kostet ~15% Aufschlag" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        {TIMELINES.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`text-left border-2 border-[#0a0a0a] p-6 transition-all ${
                active
                  ? "bg-[#ffeb3b] shadow-[6px_6px_0_#0a0a0a]"
                  : "bg-white hover:bg-[#fffbe0]"
              }`}
            >
              <div
                className="font-black uppercase text-2xl tracking-tighter"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t.label}
              </div>
              <div className="mt-2 text-sm text-[#0a0a0a]/70">{t.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBudget({
  value,
  onChange,
  priceRange,
}: {
  value: string | null;
  onChange: (v: string) => void;
  priceRange: { lo: number; hi: number } | null;
}) {
  return (
    <div>
      <StepHead label="/ 03" title="Budget-Rahmen?" hint="Ehrliche Angabe = ehrliche Antwort" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        {BUDGETS.map((b) => {
          const active = value === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onChange(b.id)}
              className={`text-left border-2 border-[#0a0a0a] p-5 transition-all ${
                active
                  ? "bg-[#0a0a0a] text-white shadow-[6px_6px_0_#ffeb3b]"
                  : "bg-white hover:bg-[#fffbe0]"
              }`}
            >
              <div
                className="font-black uppercase text-2xl tracking-tighter"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {b.label}
              </div>
              <div className={`mt-1 text-sm ${active ? "text-white/70" : "text-[#0a0a0a]/60"}`}>
                {b.desc}
              </div>
            </button>
          );
        })}
      </div>

      {priceRange && (
        <div className="mt-6 border-2 border-dashed border-[#0a0a0a]/30 p-5 bg-[#fffbe0]">
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#0a0a0a]/60">
            Grobe Kalkulation basierend auf deiner Auswahl
          </div>
          <div
            className="mt-2 text-3xl md:text-4xl font-black tracking-tighter"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {priceRange.lo.toLocaleString("de-DE")} – {priceRange.hi.toLocaleString("de-DE")} €
          </div>
          <div className="mt-1 text-xs text-[#0a0a0a]/60">
            Richtwert. Finales Angebot nach Erstgespräch.
          </div>
        </div>
      )}
    </div>
  );
}

function StepContact({
  state,
  setState,
  priceRange,
}: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  priceRange: { lo: number; hi: number } | null;
}) {
  const set = (k: keyof State) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setState((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div>
        <StepHead label="/ 04" title="Wer bist du?" hint="Wir melden uns innerhalb 24 Stunden" />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name *" value={state.name} onChange={set("name")} required maxLength={120} />
          <Field label="Firma" value={state.company} onChange={set("company")} maxLength={160} />
          <Field
            label="E-Mail *"
            value={state.email}
            onChange={set("email")}
            type="email"
            required
            maxLength={255}
          />
          <Field label="Telefon" value={state.phone} onChange={set("phone")} maxLength={60} />
        </div>

        <label className="block mt-4">
          <span className="block text-[11px] uppercase tracking-[0.2em] font-bold mb-2">
            Nachricht (optional)
          </span>
          <textarea
            value={state.message}
            onChange={set("message")}
            rows={4}
            maxLength={2000}
            className="w-full border-2 border-[#0a0a0a] p-3 text-sm bg-white focus:outline-none focus:bg-[#fffbe0]"
            placeholder="Was ist der Kontext? Bestehende Systeme? Deadlines?"
          />
        </label>
      </div>

      <aside className="border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white p-5">
        <div className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-60">
          Deine Auswahl
        </div>

        <SummaryRow label="Leistungen" value={state.services.join(" · ") || "—"} />
        <SummaryRow label="Timeline" value={TIMELINES.find((t) => t.id === state.timeline)?.label ?? "—"} />
        <SummaryRow label="Budget" value={BUDGETS.find((b) => b.id === state.budget)?.label ?? "—"} />

        {priceRange && (
          <div className="mt-5 pt-4 border-t border-white/20">
            <div className="text-[11px] uppercase tracking-[0.2em] font-bold opacity-60">
              Kalkulierter Rahmen
            </div>
            <div
              className="mt-1 text-2xl font-black tracking-tighter"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {priceRange.lo.toLocaleString("de-DE")} – {priceRange.hi.toLocaleString("de-DE")} €
            </div>
          </div>
        )}

        <p className="mt-5 text-xs opacity-70">
          Deine Daten werden ausschließlich zur Bearbeitung deiner Anfrage genutzt. Keine Weitergabe an Dritte.
        </p>
      </aside>
    </div>
  );
}

function SuccessScreen({
  state,
  priceRange,
}: {
  state: State;
  priceRange: { lo: number; hi: number } | null;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center py-12">
      <div className="inline-grid place-items-center h-20 w-20 border-4 border-[#0a0a0a] bg-[#22c55e] text-white text-4xl mb-8 shadow-[8px_8px_0_#0a0a0a]">
        ✓
      </div>
      <h1
        className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Anfrage<br />ist raus.
      </h1>
      <p className="mt-5 text-lg text-[#0a0a0a]/70">
        Danke, {state.name.split(" ")[0]}. Wir melden uns innerhalb von 24 Stunden bei{" "}
        <span className="font-bold text-[#0a0a0a]">{state.email}</span>.
      </p>

      {priceRange && (
        <div className="mt-8 inline-block border-2 border-[#0a0a0a] bg-[#fffbe0] px-6 py-4">
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#0a0a0a]/60">
            Vorläufige Range
          </div>
          <div className="mt-1 text-2xl font-black tracking-tighter" style={{ fontFamily: "var(--font-display)" }}>
            {priceRange.lo.toLocaleString("de-DE")} – {priceRange.hi.toLocaleString("de-DE")} €
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-white px-5 py-3 text-[11px] uppercase tracking-[0.2em] font-black hover:bg-[#ffeb3b]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ← Zur Startseite
        </Link>
        <a
          href={`https://wa.me/4915757971457?text=${encodeURIComponent("Hi! Ich habe gerade den Konfigurator ausgefüllt.")}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#25D366] text-white px-5 py-3 text-[11px] uppercase tracking-[0.2em] font-black hover:bg-[#0a0a0a]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sofort via WhatsApp
        </a>
      </div>
    </div>
  );
}

/* ─────────────  Small helpers  ───────────── */

function StepHead({ label, title, hint }: { label: string; title: string; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.3em] font-black text-[#ff5722]">{label}</div>
      <h2
        className="mt-2 text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.95]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {hint && <p className="mt-2 text-sm text-[#0a0a0a]/60">{hint}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">{label}</div>
      <div className="mt-0.5 text-sm font-bold break-words">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.2em] font-bold mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        className="w-full border-2 border-[#0a0a0a] px-3 py-2.5 text-sm bg-white focus:outline-none focus:bg-[#fffbe0]"
      />
    </label>
  );
}