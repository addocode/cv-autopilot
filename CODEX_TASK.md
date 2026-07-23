# CURRENT CODEX TASK – Application Package v1

## Arbeitskontext

Arbeite im Repository `addocode/cv-autopilot` vom aktuellen `main` beziehungsweise auf einem ausdrücklich davon abgeleiteten Integrationsbranch.

Verbindlich:

- `AGENTS.md` lesen und befolgen.
- Keine alten `codex/*`- oder `live-run/*`-Branches als Arbeitsbasis verwenden.
- Keine alte PR-Anweisung übernehmen.
- Der gesicherte Ausgangsstand liegt auf `archive/pre-cleanup-2026-07-22`.

## Ziel

Ein einziger Aufruf von `scripts/create-application.mjs` erzeugt aus einer gemeinsamen Bewerbungsinstanz:

1. Stellenakte und Anwendungskontext,
2. individuell ausgewählten und personalisierten CV,
3. dokumentübergreifende Bewerbungsstrategie,
4. Motivationsschreiben als HTML und PDF,
5. Mailentwurf,
6. RAV-Recap als HTML, JSON und TXT,
7. Einzelreports, Paketreport, Manifest und deterministisches Archiv.

## Aktive Architektur

- CV: bestehender Renderer unter `src/` und `scripts/render.mjs`.
- Gemeinsame Strategie: `modules/application-core/`.
- Motivationsschreiben: `modules/motivation-letter/`.
- Mail: `modules/application-email/`.
- RAV-Recap: `modules/rav-recap/`.
- Orchestrierung: `scripts/create-application.mjs`.
- Layoutschutz: `layout-lock.json` und `scripts/verify-layout-lock.mjs`.

## Unveränderliche Regeln

- Normale Bewerbungen verändern nur Daten und strukturierte Inhalte.
- Layoutdateien, Assets und Renderer-Geometrien sind hash-gesperrt.
- Keine erfundenen Fakten oder Kenntnisse.
- Keine unsichere Referenznummer aus beliebigen Zahlen ableiten.
- Empfängeradressen mit Best-Effort-Status bleiben Review-Vorschläge.
- Eine eindeutig identifizierte Bewerbungskontaktperson wird im CV-Kurzprofil und in den übrigen Anschreiben konsistent angesprochen; du/Sie folgt dem Inserat, bei unklarer Tonalität gilt formal, und nur bei unklarer Person entfällt die CV-Anrede.
- Kein automatischer Versand; Status bleibt bis zur manuellen Freigabe `draft`.

## Qualität

Vor einem Merge mindestens ausführen:

```bash
npm ci --no-audit --no-fund
npm run build
npm run validate
npm run verify:layout
npm run test:data
npm run test:application
npm run test:application-package
npm run test:rav-recap
npm run render:all
npm run test:render
```

Zusätzlich müssen die beiden MS-Golden-Fälle gerendert und mit `npm run test:motivation-letter` geprüft werden.

## Aktueller Branch

Die Konsolidierung wird auf `integration/application-package-v1` entwickelt und über einen Pull Request gegen `main` geprüft. Es wird nicht direkt auf `main` entwickelt.
