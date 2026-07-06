import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — KSE Group" },
      { name: "description", content: "Impressum und Anbieterkennzeichnung der KSE Group, Kay Steffen Engelmann, Hannover." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Impressum — KSE Group" },
      { property: "og:description", content: "Anbieterkennzeichnung gemäß § 5 DDG." },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <Link
          to="/"
          className="inline-block mb-10 text-[11px] uppercase tracking-[0.2em] font-bold text-white/60 hover:text-[#ffeb3b] transition-colors"
        >
          ← Zurück
        </Link>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-12">Impressum</h1>

        <section className="space-y-8 text-[15px] leading-relaxed text-white/85">
          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="not-italic">
              Kay Steffen Engelmann<br />
              KSE Group (Einzelunternehmen)<br />
              An der Questenhorst 10<br />
              30173 Hannover<br />
              Deutschland
            </p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Kontakt
            </h2>
            <p>
              E-Mail:{" "}
              <a href="mailto:marketing@ksegroup.eu" className="underline hover:text-[#ffeb3b]">
                marketing@ksegroup.eu
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Umsatzsteuer-ID
            </h2>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: wird nachgereicht.</p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Redaktionell verantwortlich
            </h2>
            <p>Kay Steffen Engelmann, An der Questenhorst 10, 30173 Hannover</p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              EU-Streitschlichtung
            </h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#ffeb3b]"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . Unsere E-Mail-Adresse findest du oben im Impressum.
            </p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Verbraucherstreitbeilegung
            </h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Haftung für Inhalte
            </h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
              rechtswidrige Tätigkeit hinweisen.
            </p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Haftung für Links
            </h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
              Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </div>

          <div>
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
              Urheberrecht
            </h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung
              und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
              schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}