import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung — KSE Group" },
      { name: "description", content: "Informationen zur Verarbeitung personenbezogener Daten bei der KSE Group gemäß DSGVO." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Datenschutzerklärung — KSE Group" },
      { property: "og:description", content: "Wie wir mit deinen Daten umgehen — transparent nach DSGVO." },
    ],
  }),
  component: DatenschutzPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#ffeb3b] mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <Link
          to="/"
          className="inline-block mb-10 text-[11px] uppercase tracking-[0.2em] font-bold text-white/60 hover:text-[#ffeb3b] transition-colors"
        >
          ← Zurück
        </Link>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Datenschutz&shy;erklärung</h1>
        <p className="text-white/60 text-sm mb-12">Stand: {new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>

        <section className="space-y-10 text-[15px] leading-relaxed text-white/85">
          <Section title="1. Verantwortlicher">
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
              Kay Steffen Engelmann · KSE Group<br />
              An der Questenhorst 10, 30173 Hannover<br />
              E-Mail:{" "}
              <a href="mailto:marketing@ksegroup.eu" className="underline hover:text-[#ffeb3b]">
                marketing@ksegroup.eu
              </a>
            </p>
          </Section>

          <Section title="2. Allgemeines zur Datenverarbeitung">
            <p>
              Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit
              dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und
              Leistungen erforderlich ist. Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1
              lit. a, b und f DSGVO.
            </p>
          </Section>

          <Section title="3. Hosting">
            <p>
              Diese Website wird bei einem externen Dienstleister gehostet (Lovable /
              Cloudflare). Beim Aufruf werden technisch notwendige Daten (IP-Adresse,
              Zeitstempel, User-Agent, aufgerufene URL) in Server-Logs verarbeitet, um Betrieb,
              Sicherheit und Stabilität zu gewährleisten. Rechtsgrundlage: Art. 6 Abs. 1 lit. f
              DSGVO (berechtigtes Interesse an einem stabilen, sicheren Angebot).
            </p>
          </Section>

          <Section title="4. Server-Log-Dateien">
            <p>
              Der Provider erhebt automatisch Informationen in Server-Log-Dateien: Browsertyp
              und -version, verwendetes Betriebssystem, Referrer-URL, Hostname, Uhrzeit und
              IP-Adresse. Diese Daten werden nicht mit anderen Datenquellen zusammengeführt und
              nach kurzer Zeit gelöscht, sofern keine sicherheitsrelevanten Vorfälle vorliegen.
            </p>
          </Section>

          <Section title="5. Cookies & lokaler Speicher">
            <p>
              Wir setzen ausschließlich technisch notwendige Cookies bzw. lokalen Speicher
              (localStorage) ein — z. B. um deine Session im Konfigurator zu erhalten oder
              Login-Informationen zu speichern. Ein Einsatz von Analyse- oder Marketing-Cookies
              erfolgt nicht. Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG i. V. m. Art. 6 Abs. 1
              lit. f DSGVO.
            </p>
          </Section>

          <Section title="6. Kontaktaufnahme (E-Mail, WhatsApp, Formulare)">
            <p>
              Wenn du uns per E-Mail, WhatsApp oder über ein Formular kontaktierst, werden die
              angegebenen Daten (z. B. Name, E-Mail, Nachricht) zur Bearbeitung deiner Anfrage
              verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung eines
              Vertragsverhältnisses) bzw. Art. 6 Abs. 1 lit. f DSGVO. Die Daten werden gelöscht,
              sobald sie für den Zweck nicht mehr erforderlich sind und keine
              Aufbewahrungspflichten entgegenstehen.
            </p>
          </Section>

          <Section title="7. Konfigurator / Projektanfragen">
            <p>
              Über unseren Konfigurator kannst du unverbindlich ein Projekt skizzieren. Deine
              Angaben (Projekttyp, Umfang, Kontaktdaten) verarbeiten wir ausschließlich zur
              Erstellung eines Angebots und zur Kontaktaufnahme. Rechtsgrundlage: Art. 6 Abs. 1
              lit. b DSGVO. Ohne diese Angaben können wir dein Anliegen nicht bearbeiten.
            </p>
          </Section>

          <Section title="8. Nutzung von Lovable Cloud (Backend)">
            <p>
              Für Auth, Datenbank und Speicherung nutzen wir eine gehostete Backend-Infrastruktur
              (Lovable Cloud auf Basis von Supabase, Server-Region EU). Dabei werden zur
              Bereitstellung der Funktionen erforderliche Daten (u. a. E-Mail-Adresse,
              verschlüsseltes Passwort, Session-Token, Nutzungsdaten) verarbeitet.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO. Mit dem Anbieter besteht ein
              Auftragsverarbeitungsvertrag (AVV).
            </p>
          </Section>

          <Section title="9. Weitergabe von Daten">
            <p>
              Eine Übermittlung deiner Daten an Dritte findet nur statt, soweit dies zur
              Vertragserfüllung erforderlich ist, du eingewilligt hast oder eine gesetzliche
              Verpflichtung besteht.
            </p>
          </Section>

          <Section title="10. Speicherdauer">
            <p>
              Wir speichern personenbezogene Daten nur so lange, wie es für die genannten
              Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen dies vorschreiben
              (insb. handels- und steuerrechtlich).
            </p>
          </Section>

          <Section title="11. Deine Rechte">
            <p>
              Dir stehen jederzeit folgende Rechte zu: Auskunft (Art. 15 DSGVO), Berichtigung
              (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
              Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21). Erteilte
              Einwilligungen kannst du jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>
            <p>
              Für alle Anliegen genügt eine formlose E-Mail an{" "}
              <a href="mailto:marketing@ksegroup.eu" className="underline hover:text-[#ffeb3b]">
                marketing@ksegroup.eu
              </a>
              .
            </p>
          </Section>

          <Section title="12. Beschwerderecht bei der Aufsichtsbehörde">
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
              Zuständig für uns ist die Landesbeauftragte für den Datenschutz Niedersachsen.
            </p>
          </Section>

          <Section title="13. SSL-/TLS-Verschlüsselung">
            <p>
              Diese Seite nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung.
              Verschlüsselte Verbindungen erkennst du am „https://" in der Adresszeile deines
              Browsers.
            </p>
          </Section>

          <Section title="14. Änderungen dieser Datenschutzerklärung">
            <p>
              Wir passen diese Datenschutzerklärung an, sobald sich rechtliche oder technische
              Rahmenbedingungen ändern. Es gilt jeweils die aktuelle, auf dieser Seite
              abrufbare Version.
            </p>
          </Section>
        </section>
      </div>
    </main>
  );
}