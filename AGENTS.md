# CV Autopilot – verbindlicher Agentenvertrag

## Kanonischer Stand

- `main` ist die einzige Produktionsquelle.
- Normale Bewerbungen starten von `main` beziehungsweise einem ausdrücklich von `main` abgeleiteten Integrationsbranch.
- Alte `codex/*`-, `live-run/*`-Branches und alte Pull Requests sind historische Quellen, keine Produktionsbasis.
- Der gesicherte Ausgangsstand liegt auf `archive/pre-cleanup-2026-07-22`.

## Bewerbungsmodus

Eine normale Bewerbung ist ausschliesslich ein Datenlauf:

1. Stelleninserat und validierten Anwendungskontext bereitstellen.
2. Gemeinsame Strategie und strukturierte Textinhalte erzeugen.
3. `npm run create:application -- ...` ausführen.
4. Paketreports und Vorschauen prüfen.

In diesem Modus dürfen keine Templates, CSS-Dateien, Layout-Tokens, Logos, Hintergründe, Icons oder Renderer-Geometrien geändert werden. Die Dateien in `layout-lock.json` werden vor jedem Produktionslauf per SHA-256 geprüft.

## Layoutänderungen

Layoutänderungen sind nur in einer ausdrücklich als Layout-/Generatoränderung beauftragten Aufgabe zulässig. Danach müssen alle Golden- und Render-Tests erfolgreich sein. `layout-lock.json` darf erst nach der visuellen Freigabe bewusst mit `node scripts/verify-layout-lock.mjs --write` aktualisiert werden.

## Produktionsbefehl und Ausgaben

Der einzige Paket-Einstiegspunkt ist `scripts/create-application.mjs`. Er erzeugt aus derselben Bewerbungs-ID und Faktenbasis:

- CV-PDF und -Vorschau,
- Motivationsschreiben-PDF und -Vorschau,
- Mailentwurf,
- RAV-Recap als HTML, JSON und TXT,
- Einzelreports, Paketreport, Manifest und Archiv.

Kein Dokument wird automatisch versendet. Der Paketstatus bleibt bis zu Adams manueller Freigabe `draft`.

## Verbotene Abkürzungen

- Kein Rückgriff auf alte Branches oder PRs als Ganzes.
- Kein ad-hoc PDF-Layout ausserhalb der kanonischen Renderer.
- Keine erfundenen Kenntnisse, Kontakte, Firmenangaben oder Referenznummern.
- Keine Änderung der gesperrten Layoutdateien während einer Bewerbung.
- Keine komplette Vier-Varianten-Render-Suite während eines normalen Bewerbungslaufs.
