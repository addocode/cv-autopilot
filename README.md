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

In eingeschränkten Umgebungen funktioniert das Projekt auch ohne externe Pakete, weil Render- und Testskripte nur Node.js-Standardmodule verwenden.

## Befehle

```bash
npm run validate
npm run test
npm run render -- --variant general
npm run render -- --variant communication-content
npm run render -- --variant administration-gever
npm run render -- --variant cms-web-process
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

- Die PDF-Ausgabe ist aktuell eine ATS-lesbare Phase-1-Ausgabe; die detailgetreue Browser-/Playwright-PDF-Pipeline ist vorbereitet, konnte aber wegen gesperrtem Paket-/Browserzugriff nicht installiert werden.
- SVG-Seitenvorschauen dokumentieren Raster, Farbe und Seitenlogik, ersetzen aber keinen pixelgenauen Chromium-Screenshot.
- Typografie nutzt System-Fallbacks statt eingebetteter Referenzfonts.

## Phase 2

Phase 2 soll eine automatische Stelleninserat-Analyse ergänzen: Inserat einlesen, Anforderungen extrahieren, belegte CV-Bausteine matchen, Variante vorschlagen, Längenbudget prüfen und anonymisierte Demo-Daten für öffentliche Präsentationen erzwingen.
