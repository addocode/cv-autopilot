# CV Autopilot

Dieses Repository enthält vertrauliche Bewerbungs- und Kontaktdaten und muss privat bleiben. Vor einer Änderung auf öffentliche Sichtbarkeit müssen sämtliche personenbezogenen Daten, Referenzkontakte und privaten Bewerbungsunterlagen entfernt oder anonymisiert werden.

## Überblick

CV Autopilot ist ein lokales, datengetriebenes Node.js-/TypeScript-Framework zum Rendern von vier zweitseitigen CV-Varianten für Adam Dolinsky. Die Gestaltung orientiert sich am 2d-Referenz-CV: A4, Holz-Hintergrund, blauer Innenrahmen, weisse Inhaltsflächen, kreisförmiges Profilbild und kompakte Editorial-Struktur.

## Datenschutz und Public-/Demo-Modus

- Das Repository darf nicht öffentlich gemacht werden.
- Der normale Produktionsmodus verwendet die vollständigen realen Daten aus `data/private/cv.master.json`.
- Falls später ein Public- oder Demo-Modus vorgesehen wird, muss dieser ausdrücklich anonymisierte Beispieldaten verwenden.
- Niemals speichern: Passwörter, API-Schlüssel, Access Tokens, private SSH-Schlüssel, Session-Cookies oder sonstige technische Zugangsdaten.

## Installation

Benötigt Node.js 20 LTS oder neuer.

```bash
npm install
```

Für Produktions-Rendering werden Playwright und Chromium benötigt. In eingeschränkten Umgebungen ohne Paket-/Browserzugriff schlägt `npm run render:all` bewusst fehl, statt ein falsches erfolgreiches PDF zu melden. Ein Debug-Fallback ist nur mit `--debug-fallback` erlaubt und gilt nicht als Produktionsrender.

## Befehle

```bash
npm run validate
npm run test
npm run render -- --variant general
npm run render -- --variant communication-content
npm run render -- --variant administration-gever
npm run render -- --variant cms-web-process
npm run render:all
```

Ausgaben liegen in `dist/`: HTML-Preview, PDF, SVG-Seitenvorschauen und `render-report-*.json`.

## Architektur

- `data/private/cv.master.json`: zentrale reale CV-Datenbank.
- `data/public/variants/*.json`: Prioritäten und Headline je Variante.
- `data/sources/source-map.json`: Quellenmapping wichtiger Bausteine.
- `src/types`, `src/lib`, `src/templates`, `src/styles`: TypeScript-Struktur für Daten, Variantenlogik, Templates und Design Tokens.
- `scripts/render.mjs`: robuster Node-Renderer für Phase 1.
- `tests/`: Node-Test-Runner-Checks.

## CV-Anpassung für Stellen

1. Passende Variante wählen.
2. In `data/public/variants/<variant>.json` Prioritäts-Tags anpassen.
3. Nur belegte Bulletpoints in `data/private/cv.master.json` aktiv priorisieren oder kürzen.
4. `npm run validate`, `npm run render -- --variant <variant>` und `npm run test` ausführen.
5. Render Report auf Warnungen und Zwei-Seiten-Kontrolle prüfen.

## Bekannte visuelle Abweichungen

- Die Produktionspipeline rendert HTML, PDF und PNG aus demselben DOM/CSS mit Playwright/Chromium.
- Lokale Umgebungen ohne npm-/Chromium-Zugriff können den Produktionsrender nicht ausführen; GitHub Actions installiert die Abhängigkeiten und lädt PDFs, PNGs und Reports als Artefakte hoch.
- Typografie nutzt System-Fallbacks statt eingebetteter Referenzfonts.

## Phase 2

Phase 2 soll eine automatische Stelleninserat-Analyse ergänzen: Inserat einlesen, Anforderungen extrahieren, belegte CV-Bausteine matchen, Variante vorschlagen, Längenbudget prüfen und anonymisierte Demo-Daten für öffentliche Präsentationen erzwingen.

## Produktionspipeline und Qualitätskontrollen

Der Hauptrenderer ist `scripts/render.mjs` mit Playwright/Chromium. Er misst `scrollHeight`, `clientHeight`, Bounding Boxes aller markierten Module, geladene Bilder, Links und die tatsächliche PDF-Seitenzahl. Bei Overflow, fehlendem Chromium oder falscher Seitenzahl beendet der Render mit Fehlercode. `render-report-<variant>.json` enthält `success`, `pageCount`, `overflows`, `elementId`, `scrollHeight`, `clientHeight`, `overflowPixels`, `warnings`, Variante und Renderzeitpunkt.

## GitHub Actions

Der Workflow `.github/workflows/render-cv.yml` läuft auf Pull Requests, manueller Auslösung und Pushes auf `codex/arbeite-am-modularen-cv-framework`. Da aktuell kein `package-lock.json` vorhanden ist, verwendet er vorläufig `npm install --no-audit --no-fund` statt `npm ci` und kein npm-Cache in `actions/setup-node`. Er führt aus:

```bash
npm install --no-audit --no-fund
npx playwright install --with-deps chromium
npm run build
npm run validate
npm run render:all
npm run test
```

Anschliessend werden PDFs, PNG-Screenshots, HTML-Previews und Render Reports als Artefakte hochgeladen.
