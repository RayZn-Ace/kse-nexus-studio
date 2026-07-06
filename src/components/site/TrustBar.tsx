import { useEffect, useState } from "react";

const SIGNALS = [
  { icon: "⚡", text: "Antwort innerhalb 2 Stunden" },
  { icon: "🚀", text: "3 neue Projekte diese Woche gestartet" },
  { icon: "⭐", text: "4.9 Sterne · 47+ Kundenprojekte" },
  { icon: "🇩🇪", text: "Made in Hannover · Deutschland" },
  { icon: "🤝", text: "Kostenloses Erstgespräch · Unverbindlich" },
  { icon: "🔒", text: "DSGVO-konform · Server in der EU" },
];

export function TrustBar() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SIGNALS.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full bg-[#0a0a0a] text-white border-b-2 border-[#ff5722] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-8 md:h-9 flex items-center justify-between gap-4 text-[11px] md:text-xs uppercase tracking-[0.18em] font-bold">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e] animate-pulse shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline text-[#22c55e]">LIVE</span>
          <div className="relative h-5 flex-1 min-w-0 overflow-hidden">
            {SIGNALS.map((s, i) => (
              <div
                key={i}
                className="absolute inset-0 flex items-center gap-2 transition-all duration-500 whitespace-nowrap truncate"
                style={{
                  transform: `translateY(${(i - idx) * 100}%)`,
                  opacity: i === idx ? 1 : 0,
                }}
              >
                <span aria-hidden="true">{s.icon}</span>
                <span className="truncate">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
        <a
          href="/konfigurator"
          className="shrink-0 hidden md:inline-flex items-center gap-2 text-[#ffeb3b] hover:text-white transition-colors"
        >
          Projekt konfigurieren →
        </a>
      </div>
    </div>
  );
}