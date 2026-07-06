import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "kse-cookie-consent-v1";

type Consent = {
  essential: true;
  timestamp: string;
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = () => {
    const consent: Consent = { essential: true, timestamp: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      /* ignore */
    }
    setVisible(false);
    setShowSettings(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie-Hinweis"
      className="fixed inset-x-3 bottom-3 z-[70] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md"
    >
      <div className="brutal-tile border-4 border-[#0a0a0a] bg-white p-5 md:p-6">
        {!showSettings ? (
          <>
            <div className="text-[10px] uppercase tracking-[0.22em] font-black text-[#ff5722] mb-2">
              Cookies
            </div>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-[#0a0a0a] mb-2">
              Nur das Nötigste.
            </h2>
            <p className="text-sm text-[#0a0a0a]/75 leading-relaxed mb-4">
              Wir nutzen ausschließlich technisch notwendige Cookies bzw. lokalen Speicher — kein Tracking, keine Analyse, keine Werbung. Mehr in unserer{" "}
              <Link to="/datenschutz" className="underline font-semibold hover:text-[#ff5722]">
                Datenschutzerklärung
              </Link>
              .
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#0a0a0a]/70 hover:text-[#0a0a0a] px-2 py-2"
              >
                Einstellungen
              </button>
              <button
                onClick={save}
                className="flex-1 brutal-tile brutal-tile-hover brutal-tile-press border-4 border-[#0a0a0a] bg-[#ffeb3b] text-[#0a0a0a] text-sm font-black uppercase tracking-[0.14em] px-4 py-3"
              >
                Verstanden
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-[0.22em] font-black text-[#ff5722] mb-2">
              Einstellungen
            </div>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-[#0a0a0a] mb-4">
              Cookie-Kategorien
            </h2>

            <div className="border-2 border-[#0a0a0a] p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-black uppercase tracking-wide text-[#0a0a0a]">
                  Technisch notwendig
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] font-bold bg-[#0a0a0a] text-white px-2 py-1">
                  Immer aktiv
                </div>
              </div>
              <p className="text-xs text-[#0a0a0a]/70 leading-relaxed">
                Für Session, Login und Konfigurator-Zustand. Ohne diese funktioniert die Seite nicht.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#0a0a0a]/40 p-3 mb-4 opacity-70">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-black uppercase tracking-wide text-[#0a0a0a]">
                  Analyse & Marketing
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#0a0a0a]/60">
                  Nicht eingesetzt
                </div>
              </div>
              <p className="text-xs text-[#0a0a0a]/70 leading-relaxed">
                Wir setzen keine Analyse- oder Marketing-Cookies ein.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#0a0a0a]/70 hover:text-[#0a0a0a] px-2 py-2"
              >
                Zurück
              </button>
              <button
                onClick={save}
                className="flex-1 brutal-tile brutal-tile-hover brutal-tile-press border-4 border-[#0a0a0a] bg-[#ffeb3b] text-[#0a0a0a] text-sm font-black uppercase tracking-[0.14em] px-4 py-3"
              >
                Auswahl speichern
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}