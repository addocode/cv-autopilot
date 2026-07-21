# ACTIVE CODEX ADDENDUM — Review Runde 49

Dieses Addendum ergänzt `ACTIVE_CODEX_TASK.md` (Review Runde 48) auf demselben Branch. Alle Aufgaben aus Runde 48 bleiben verbindlich. Bei Widersprüchen gilt dieses Addendum.

- Arbeite ausschliesslich auf `codex/verifiziere-icon-hashes-und-svg-geometrie` und PR #6.
- Erstelle keinen neuen Branch und keinen neuen Pull Request.
- Rufe `make_pr` nicht auf.
- Merge nichts.
- Verändere keine Schrift- oder Icongrössen.
- Erhalte exakt zwei Seiten, keine Overflows, keine Collisions und keine Warnungen.

---

## 1. Verbindliche Dummy-Eckdaten für den Personalisierungstest

Die folgenden Angaben sind **ausschliesslich Testdaten**. Sie dürfen nicht als Produktionsstandard in `data/private/cv.master.json` gespeichert oder in den neutralen vier Produktions-CVs angezeigt werden.

Verwende beziehungsweise aktualisiere die formelle Testfixture, bevorzugt:

`tests/fixtures/application-context-formal.json`

mit diesen Eckdaten:

```json
{
  "jobAd": {
    "rawText": "Pensum 80 %. Stellenantritt per 1. September 2026. Ansprechperson: Frau Anna Meier, HR-Leitung.",
    "sourceId": "job-ad-fixture-formal-r49",
    "workload": {
      "kind": "single",
      "minPercent": 80,
      "maxPercent": 80,
      "sourceText": "Pensum 80 %",
      "confidence": 0.99
    },
    "start": {
      "kind": "date",
      "isoDate": "2026-09-01",
      "sourceText": "Stellenantritt per 1. September 2026",
      "confidence": 0.99
    },
    "contact": {
      "fullName": "Anna Meier",
      "firstName": "Anna",
      "lastName": "Meier",
      "explicitSalutation": "Frau",
      "role": "HR-Leitung",
      "addressMode": "formal",
      "sourceText": "Ansprechperson: Frau Anna Meier, HR-Leitung",
      "confidence": 0.99,
      "isApplicationContact": true
    }
  }
}
```

Der echte Fixture-Render muss sichtbar und ATS-extrahierbar ergeben:

```text
Guten Tag Frau Meier, ich bin ...
```

```text
PENSUM
80 % gemäss Inserat, flexibel nach Absprache
```

```text
EINTRITT
Per 01.09.2026 gemäss Inserat, alternativ nach Vereinbarung
```

Verbindlich:

- Die Anrede bleibt nahtlos im einzigen `#summary-text` integriert.
- Kein separates Greeting-Element und keine separate Greeting-Zeile.
- Das System erzeugt grammatisch korrekt die kleingeschriebene Fortsetzung `ich bin ...`.
- Das gesamte Kurzprofil bleibt möglichst exakt vier sichtbare Zeilen.
- `Anna Meier`, `80 %` und `01.09.2026` erscheinen niemals im neutralen Produktionsrender ohne `--application-context`.
- Die Testfixture darf normale Produktionsartefakte nicht überschreiben; verwende einen Output-Suffix oder temporären Pfad.

Ergänze Fixture-Tests für Parsed Value, sichtbaren Text, ATS, vier Kurzprofilzeilen und kollisionsfreien Footer.

---

## 2. Öffentliche geschäftliche Telefonnummer im Kopfbereich

Füge die öffentliche geschäftliche Telefonnummer als verifizierte Person-/Kontaktdaten in die Master-Datenquelle ein:

```text
+41 41 413 22 22
```

Empfohlene Datenstruktur:

```json
{
  "person": {
    "businessPhone": "+41 41 413 22 22"
  }
}
```

oder gleichwertig im bestehenden Kontaktschema.

### 2.1 Sichtbare Darstellung

Die Telefonnummer erscheint im blauen Kopfbereich auf **derselben horizontalen Zeile wie die E-Mail-Adresse**.

Verbindliche Ausrichtung:

- E-Mail bleibt links an ihrer bisherigen Position.
- Die Telefonnummer beginnt exakt auf derselben X-Achse wie der Button `LinkedIn`.
- Der Button `dolinsky.ch` und die E-Mail bilden die erste Spalte.
- Der Button `LinkedIn` und die Telefonnummer bilden die zweite Spalte.
- Der horizontale Abstand der beiden Kontaktspalten entspricht dem Abstand der beiden Buttons.
- Telefonnummer und E-Mail verwenden dieselbe Schriftfamilie, Schriftgrösse, Farbe, Zeilenhöhe und normale Laufweite.
- Telefonnummer ist kein Pill-Button und besitzt keinen Rahmen/Hintergrund.
- Profilbildgrösse, Buttongrössen und die R47-Verschiebung der Identitätsgruppe um 5 mm bleiben unverändert.

Bevorzugte robuste Struktur: eine gemeinsame zweispaltige CSS-Grid-Achse für Kontaktzeile und Buttonzeile, zum Beispiel sinngemäss:

```html
<div class="hero-contact-actions-grid">
  <a class="hero-email" href="mailto:adam@dolinsky.ch">adam@dolinsky.ch</a>
  <a class="hero-phone" href="tel:+41414132222">+41 41 413 22 22</a>
  <a class="hero-button hero-portfolio" href="...">dolinsky.ch</a>
  <a class="hero-button hero-linkedin" href="...">LinkedIn</a>
</div>
```

```css
.hero-contact-actions-grid {
  display: grid;
  grid-template-columns: max-content max-content;
  column-gap: 5mm;
}
```

Eine gleichwertige Lösung ist zulässig, sofern die gemessenen X-Achsen stimmen.

Die Standortzeile `Bern` darf oberhalb dieser gemeinsamen Kontaktzeile bleiben.

### 2.2 Funktion und ATS

- `href="tel:+41414132222"`
- sichtbarer Text exakt `+41 41 413 22 22`
- `data-ats-required` beziehungsweise gleichwertige ATS-Markierung
- in HTML, PDF, Poppler Raw, Poppler Default und PDF.js vollständig erkennbar
- keine Token-Trennung wie `+41 41 413 22 2 2`
- keine Kollision mit Name, Headline, Buttons, Kurzprofil oder Profilbild

### 2.3 Report und Tests

Ergänze mindestens:

```json
{
  "contactLayout": {
    "businessPhoneText": "+41 41 413 22 22",
    "businessPhoneVisible": true,
    "businessPhoneAtsExtractable": true,
    "businessPhoneLinkValid": true,
    "emailTopPx": 0,
    "phoneTopPx": 0,
    "sameContactRowDeltaPx": 0,
    "linkedinLeftPx": 0,
    "phoneLeftPx": 0,
    "phoneAlignedWithLinkedInDeltaPx": 0,
    "alignmentPassed": true
  }
}
```

Toleranzen:

- vertikale Differenz E-Mail/Telefon: höchstens 1 px
- horizontale Differenz Telefon/LinkedIn-Linkskante: höchstens 1 px

Teste alle vier Varianten.

---

## 3. Einheitlicher Abstand der beiden Haupttitel zur jeweiligen Trennlinie

Der vertikale Abstand zwischen:

```text
FÄHIGKEITEN UND SKILLS
```

und der oberen Trennlinie des ersten Skillsets auf Seite 1 ist der verbindliche Referenzabstand.

Der Abstand zwischen:

```text
LEBENSLAUF UND VERANTWORTUNG
```

und der oberen Trennlinie der Experience-Liste auf Seite 2 muss exakt gleich gross wirken und gemessen nahezu identisch sein.

### 3.1 Robuste CSS-Umsetzung

Verwende bevorzugt eine gemeinsame CSS-Variable, beispielsweise:

```css
:root {
  --page-section-title-rule-gap: ...;
}
```

und wende sie konsistent auf beide Titel-/Linien-Paare an.

Zu messen sind jeweils:

- Unterkante des sichtbaren Titel-Text-Bounding-Rects
- Mittellinie der nachfolgenden horizontalen Border/Rule

Nicht nur CSS-Margin-Werte vergleichen; die tatsächlichen DOM-Abstände müssen gleich sein.

### 3.2 Report

Ergänze mindestens:

```json
{
  "layout": {
    "sectionTitleRuleSpacing": {
      "pageOneTitleBottomPx": 0,
      "pageOneRuleCenterYPx": 0,
      "pageOneGapPx": 0,
      "pageTwoTitleBottomPx": 0,
      "pageTwoRuleCenterYPx": 0,
      "pageTwoGapPx": 0,
      "deltaPx": 0,
      "requirementPassed": true
    }
  }
}
```

Verbindliche Toleranz:

```text
abs(pageOneGapPx - pageTwoGapPx) <= 1 px
```

Dabei bleiben erhalten:

- beide Titel in Roboto Slab 700
- identische Titelgrösse und Rule-Farbe
- die obere Linie des ersten Skillsets
- die obere Linie der Experience-Liste
- R47-Geometrie und Hero-Höhe 98 mm
- keine Schriftverkleinerung
- keine dritte Seite

---

## 4. Regressionen und Workflow

Zusätzlich zu allen Gates aus Review Runde 48 testen:

1. Formelle Fixture enthält Frau Anna Meier / HR-Leitung / 80 % / 01.09.2026.
2. Formeller Fliesstext beginnt `Guten Tag Frau Meier, ich bin`.
3. Neutraler Produktionsrender enthält keinen dieser Dummy-Werte.
4. Geschäftsnummer ist in allen vier Varianten sichtbar, klickbar und ATS-extrahierbar.
5. Geschäftsnummer und E-Mail liegen auf derselben Zeile.
6. Geschäftsnummer beginnt bündig mit `LinkedIn`.
7. Beide Haupttitel besitzen denselben real gemessenen Abstand zur nachfolgenden Trennlinie.
8. Exakt zwei Seiten, keine Overflows, keine Collisions, keine Warnungen.
9. Alle R48-Fill-, BM- und Education-Gates bleiben erfüllt.

Vollständig ausführen:

```bash
npm install --no-audit --no-fund
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
```

Erfolg erst bei beiden Exit-Codes `0`, allen Reports `success: true`, Visual Review `overallSuccess: true`, `remainingDifferences: []` und übersprungenem finalen Guard.

Berichte im Abschluss zusätzlich:

- exakter Fixture-Text für Greeting, Pensum und Eintritt
- Phone-/E-Mail-/LinkedIn-Ausrichtungsmessungen
- ATS-Ergebnis der Telefonnummer
- Titel-zu-Linien-Abstände beider Seiten und deren Delta

Beginne nach vollständiger Umsetzung von Review Runde 48 mit diesem Addendum und fahre ohne weitere Rückfrage fort.
