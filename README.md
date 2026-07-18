# CV Autopilot

Dieses Repository enthält vertrauliche Bewerbungs- und Kontaktdaten und muss privat bleiben. Vor einer Änderung auf öffentliche Sichtbarkeit müssen sämtliche personenbezogenen Daten, Referenzkontakte und privaten Bewerbungsunterlagen entfernt oder anonymisiert werden.

## Produktionsstand

CV Autopilot rendert den zweitseitigen Lebenslauf von Adam Dolinsky datengetrieben aus einer zentralen CV-Datenbank und vier Varianten. Der Produktionsrenderer ist Playwright/Chromium: HTML-Preview, PDF und PNG-Screenshots entstehen aus demselben DOM und denselben CSS-Dateien. Die PDFs bleiben ATS-lesbar und enthalten markierbaren Text sowie klickbare Links.

## Datenschutz und Public-/Demo-Modus

- Das Repository darf nicht öffentlich gemacht werden.
- Der normale Produktionsmodus verwendet die vollständigen realen Daten aus `data/private/cv.master.json`.
- Ein späterer Public- oder Demo-Modus muss ausdrücklich anonymisierte Beispieldaten verwenden.
- Niemals speichern: Passwörter, API-Schlüssel, Access Tokens, private SSH-Schlüssel, Session-Cookies oder sonstige technische Zugangsdaten.

## Installation

Benötigt Node.js 22 im CI-Workflow und eine lokale Node-Version, die ES-Module unterstützt.

```bash
npm install --no-audit --no-fund
npx playwright install --with-deps chromium
```

## Befehle

```bash
npm run build
npm run validate
npm run test:data
npm run render:all
npm run test:render
npm test
```

Einzelrender:

```bash
npm run render -- --variant general
npm run render -- --variant communication-content
npm run render -- --variant administration-gever
npm run render -- --variant cms-web-process
```

## Varianten

- `general`
- `communication-content`
- `administration-gever`
- `cms-web-process`

Varianten steuern Headline, Kurzprofil, Skill-Reihenfolge, sichtbare Skillblöcke, Bullet-Auswahl, Bullet-Priorisierung, Tool-Reihenfolge, Maximalzahlen und Längenbudgets.

## Architektur

- `data/private/cv.master.json`: zentrale reale CV-Datenbank.
- `data/public/variants/*.json`: Varianten-Overrides.
- `data/schema/cv.schema.json`: Datenstruktur für Person, Erfahrungen, Skills, Quellen, Tools, Referenzen, Eintritt und Pensum.
- `data/sources/source-map.json`: Quellenmapping der produktiven Bausteine.
- `scripts/render.mjs`: Playwright-Produktionsrenderer.
- `scripts/render-all.mjs`: rendert alle vier Varianten.
- `scripts/validate.mjs`: Daten- und Variantenvalidierung.
- `src/styles/tokens.css`: Design-, Font- und Spacing-Tokens.
- `src/styles/cv.css`: A4-Layout, Print-/Screen-Styles, Hover-/Focus-Zustände.
- `tests/data.test.mjs`: Daten-, Varianten- und Workflow-Invarianten.
- `tests/render.test.mjs`: Render-Artefakte, Reports, Fonts, Assets, Hover/Focus.

## Ausgaben

Für jede Variante entstehen:

```text
dist/Lebenslauf_Adam-Dolinsky_<variant>.pdf
dist/cv-<variant>-page-1.png
dist/cv-<variant>-page-2.png
dist/cv-<variant>-preview.html
dist/render-report-<variant>.json
```

## Render Report

Jeder `render-report-<variant>.json` prüft und dokumentiert:

- `success`
- `renderer`
- `pageCount`
- `overflows`
- `collisions`
- `warnings`
- `assets`
- `images`
- `links`
- `fonts`
- `buttonStates`
- `ats`
- `reviewQueue`
- `supplementary.candidateItems`, `supplementary.renderedItems`, `supplementary.rejectedItems`
- `fill.baselineGapPx`, `fill.finalGapPx`, `fill.preferredOptionalBulletCount`, `fill.maxOptionalBullets`

Ein erfolgreicher Produktionsrender benötigt `renderer: "playwright"`, exakt zwei Seiten, keine Overflows, keine Collisions und keine Warnungen.

## Qualitätsprüfungen

Der Playwright-Renderer prüft:

- tatsächliche PDF-Seitenzahl,
- `scrollHeight`/`clientHeight`,
- Elementgrenzen innerhalb Seite und Panel,
- paarweise Bounding-Box-Kollisionen,
- Profilbild,
- CSS-Hintergrundbild,
- Links,
- verwendete Schriftfamilien,
- Times-New-Roman-Fallback-Warnung,
- Button-Normal-, Hover- und Focus-Zustand,
- adaptive Fill-Entscheidungen inklusive akzeptierter/abgelehnter Kandidaten,
- zusätzliche verifizierte Master-Tools und datengetriebene Tool-Hinweise.

## ATS und manuelle Schlusskontrolle

Der Renderer erzeugt echten HTML-Text und Playwright-PDFs mit auswählbarem Text. Der Render Report enthält einen ATS-Block mit Textauslesbarkeit, Lesereihenfolge, Pflichtbegriffen, Keyword-Coverage, Keyword-Stuffing-Risiko und Hidden-Text-Prüfung. Spätere Stellenanalysen dürfen nur `verified` und vertretbare `defensible_inference`-Bausteine nutzen; `inferred_review_required` wird in `reviewQueue` gemeldet und darf nicht automatisch produktiv sichtbar werden. Der Agent erzeugt Bewerbungsartefakte, versendet sie aber niemals automatisch; die Schlusskontrolle bleibt manuell bei Adam.

## GitHub Actions

Der Workflow `.github/workflows/render-cv.yml` läuft nur auf:

- `pull_request`
- `workflow_dispatch`

Er installiert Node.js 22, npm-Abhängigkeiten und Chromium, führt Build, Validierung, Daten-Tests, Render-All und Render-Tests aus und lädt PDFs, PNGs, HTML-Previews sowie Reports als Artefakt `cv-render-artifacts` hoch. Der finale Guard bleibt aktiv und lässt den Job nur grün werden, wenn Render und Render-Tests intern erfolgreich sind.

## Intelligente Zusatz- und Fill-Logik

Die Varianten zeigen zunächst die definierten Kerninhalte. Danach führt der Playwright-Renderer einen kontrollierten Mess-Fill aus: Er misst den Baseline-Abstand zwischen Berufserfahrung und Bottom-Grid, blendet optionale verifizierte Kandidaten nach `fillPriority` einzeln ein, misst erneut und behält einen Kandidaten nur, wenn keine Overflows/Collisions entstehen, weiterhin exakt zwei Seiten vorhanden sind und die Mindestreserve eingehalten bleibt. Wenn verifizierte Masterdaten wegen Variantenfokus, Tool-Limit oder Platzbudget ausgeblendet werden, ergänzt der Renderer nur datengetriebene Hinweise wie `+ weitere mediamatikbezogene Tools und Systeme` oder priorisierte Erfahrungshinweise bis `maxPerVariant`. Optionale Zusatzpunkte und zusätzliche Tools besitzen stabile IDs, Tags, Evidence-Level, Quellen, ATS-Synonyme, Status, Variantenrelevanz, Priorität und Sichtbarkeitsmetadaten; Entscheidungen werden im Render Report unter `supplementary` und `fill` dokumentiert. `preferredOptionalBulletCount` ist nur ein weicher Richtwert; `maxOptionalBullets` ist die Sicherheitsobergrenze, während der gemessene Freiraum entscheidet.

## Typografie

Die CSS-Font-Stacks orientieren sich an der Referenz:

- Avenir Black bzw. Fallback für Name, Headline und markante sans-serif Überschriften.
- Avenir Book bzw. Fallback für Fliesstext, Kontaktdaten, Erfahrungen, Tools, Referenzen und Sprachen.
- Roboto Slab Bold bzw. Fallback für Kurzprofil-Überschrift und Link-Buttons.

Es werden keine proprietären Avenir-Fontdateien committed. Times New Roman ist nicht Bestandteil der Produktions-Font-Stacks.

## Hintergrundbild

`assets/bg_img.jpeg` wird als seitenfüllender Hintergrund mit `background-size: cover`, `background-position: left top`, `background-repeat: no-repeat` und transparenter Seitenfarbe gerendert. Der Render Report prüft zusätzlich `coversFullPage`, `bottomZoneNotGray`, `topLeftLaptopExpected`, die tatsächlich berechnete Position und die Größe.

## CV-Anpassung für Stellen

1. Passende Variante wählen.
2. In `data/public/variants/<variant>.json` Prioritäts-Tags, Bullet-Auswahl oder Budgets anpassen.
3. Nur belegte Inhalte aus `data/private/cv.master.json` verwenden.
4. `npm run validate`, `npm run render:all` und `npm run test:render` ausführen.
5. Render Reports und PNGs prüfen.

## Verbleibende visuelle Abweichungen

- Systemabhängige Avenir-Verfügbarkeit kann zu Fallbacks wie Nunito Sans, Montserrat oder Arial führen.
- Der Hintergrund nutzt `background-position: left top` und `background-size: cover`; Laptop/Tastatur bleiben oben links sichtbar, die Referenz kann je nach Chromium-Fontmetrik noch leicht im Bildausschnitt abweichen.
- Kleine Unterschiede zu InDesign bei Mikrotypografie und exakten Zeilenumbrüchen bleiben möglich.
