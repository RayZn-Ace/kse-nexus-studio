
## Kurz zur Frage: "As featured in" / Awards-Leiste

Eine horizontale Leiste unter dem Hero mit Logos von **Publikationen, Awards oder Partnern**, die euch erwähnt haben — z.B. "Featured in: t3n · Handelsblatt · OMR", oder Auszeichnungen ("Awwwards Site of the Day", "Meta Business Partner"). Erzeugt sofort Vertrauen. Kann später kommen wenn ihr echte Nennungen habt — ich lasse es erstmal weg, statt Fake-Logos einzubauen.

---

## Umsetzungsplan (4 Phasen)

Reihenfolge nach Impact auf Conversion, damit du früh Ergebnisse siehst.

### Phase 1 — Quick Wins & Conversion-Kern (heute umsetzbar)

1. **WhatsApp-Floating-Button** unten rechts, öffnet `wa.me/4915757971457` mit vorbefülltem Text. Sichtbar auf allen Seiten, Mobile-first.
2. **Live Trust-Bar** direkt unter der Nav: rotierende Signale ("3 Projekte diese Woche gestartet · ⚡ Antwort <2h · ⭐ 4.9 von 47 Kunden · 🇩🇪 Hannover"). Dezent animiert.
3. **Custom Cursor** (nur Desktop): kleiner Kreis der über Kacheln/Links zu "→" morpht. Respektiert `prefers-reduced-motion`.

### Phase 2 — Interaktiver Projekt-Konfigurator (die Lead-Maschine)

Eigene Route `/konfigurator`, prominent verlinkt im Hero + Nav.

**4-Step Wizard:**
1. **Was brauchst du?** (Multi-Select: Software · AI-Automation · Website · Marketing · Branding)
2. **Wie dringend?** (ASAP · 1-3 Monate · Q2 2026+)
3. **Budget-Range** (Slider: <10k · 10-30k · 30-80k · 80k+)
4. **Kontakt** (Name, Firma, E-Mail, Telefon optional)

**Am Ende:**
- Auto-berechnete Preis-Range + Timeline-Empfehlung
- Speicherung in `contact_messages` (Tabelle existiert schon) mit neuen Feldern `services`, `budget_range`, `timeline`
- Bestätigungs-E-Mail an dich via Lovable Emails
- CTA "Direkt Termin buchen" → Cal.com/Kontakt

### Phase 3 — Vertrauen & Storytelling

4. **Prozess-Timeline** interaktiv auf Homepage (ersetzt/erweitert `ProcessSection`): 5 Schritte (Discovery → Konzept → Design → Build → Launch), scroll-getriggerte Icons + Zeiträume.
5. **Team-Seite** `/team`: Grid mit Foto, Name, Rolle, kurzem Bio, LinkedIn. Neue DB-Tabelle `team_members` + Admin-CRUD unter `/admin/team`. Fotos wirst du uploaden (Lovable Assets oder Storage-Bucket).
6. **Logo-Wall** auf Homepage: Grayscale-Kunden-Logos, hover = farbig. Neue Tabelle `client_logos` + Admin-Upload.
7. **Case Study Deep-Dives** unter `/cases/$slug`:
   - Neue Tabelle `case_studies` (slug, kunde, branche, herausforderung, lösung, ergebnisse-json, hero_image, gallery)
   - Admin-Editor unter `/admin/cases`
   - Öffentliche Liste `/cases` + Detailseiten mit Vorher/Nachher-Slider, Metriken-Kacheln, Kunden-Zitat
   - SEO-optimiert (unique title, description, og:image aus hero_image)

### Phase 4 — Lead-Magnet & Newsletter

8. **Newsletter-Sign-up** mit PDF-Lead-Magnet "10 AI-Automations die jedes Unternehmen braucht":
   - Sektion auf Homepage + Footer + Exit-Intent-Popup (dezent)
   - Neue Tabelle `newsletter_subscribers` (email, source, confirmed, created_at)
   - Double-Opt-In-Mail via Lovable Emails mit PDF-Link (PDF-Erstellung: ich generiere eine erste Version aus einem Content-Brief, den du mir gibst; upload via Lovable Assets)
   - Admin-View unter `/admin/newsletter` (Liste, CSV-Export)

---

## Technische Details

- **Datenbank**: neue Tabellen `team_members`, `client_logos`, `case_studies`, `newsletter_subscribers`; Ergänzung `contact_messages` um Konfigurator-Felder. Alle mit RLS: public SELECT für published-Items, INSERT/UPDATE/DELETE nur für Admin-Rolle (Rolle existiert schon via `has_role`).
- **Server-Logik**: TanStack `createServerFn` für Konfigurator-Submit, Newsletter-Sign-up, E-Mail-Trigger. Alles bestehendes Muster.
- **E-Mails**: Lovable Emails (built-in), keine externen Provider nötig.
- **Admin**: Neue Panels reihen sich in bestehende `/admin/*` Struktur ein.
- **PDFs**: Ich kann eine erste Version des Lead-Magnets als PDF erstellen — du gibst mir den Content-Kern (5-10 Bulletpoints pro Automation reichen).

---

## Was ich brauche bevor's losgeht

Nichts Blockierendes für Phase 1. Für später:
- Team-Fotos + Bios (Phase 3.5)
- Kunden-Logos (Phase 3.6) — freigegeben zur Nutzung?
- 2-3 echte Cases mit Zahlen (Phase 3.7)
- Content-Skelett für den Lead-Magnet oder freie Hand? (Phase 4)

---

## Vorschlag zum Start

Ich baue **Phase 1 komplett + starte den Konfigurator (Phase 2)** in einem Rutsch. Das gibt dir sofort die Conversion-Booster live. Danach gehen wir Phase 3 & 4 einzeln an mit deinem Content.

Passt der Plan so oder soll ich Teile umsortieren / rauslassen?
