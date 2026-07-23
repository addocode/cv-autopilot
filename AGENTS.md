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
5. Die erzeugte öffentliche Stellenakte unter `job-ad-archive/<applicationId>/`
   auf GitHub veröffentlichen.

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

## Dauerhaftes Stelleninserat-Archiv

- Jeder echte Bewerbungslauf erzeugt zusätzlich
  `job-ad-archive/<applicationId>/00_stelleninserat.md`.
- Diese GitHub-Akte enthält ausschliesslich öffentlich publizierte Inseratsdaten,
  Quellenmetadaten und den Inhalts-Hash.
- CV, Motivationsschreiben, persönliche Strategie, Gap-Analyse, RAV-Daten und PDFs
  dürfen nicht in dieses öffentliche Archiv kopiert werden.
- Ein Live-Run gilt erst dann als dauerhaft auf GitHub archiviert, wenn die neue
  Stellenakte committed und veröffentlicht wurde. Ist kein GitHub-Schreibzugriff
  möglich, muss dies im Ergebnis ausdrücklich als offen ausgewiesen werden.

## Dokumentübergreifende Empfängerregel

- Für CV, Motivationsschreiben, Mail und RAV gilt ausschliesslich der validierte Bewerbungskontakt aus dem gemeinsamen Anwendungskontext.
- Ist eine persönliche Bewerbungskontaktperson eindeutig identifiziert, beginnt das Kurzprofil im CV direkt im Fliesstext mit einer Anrede derselben Person.
- Formelle Inserate verwenden `Guten Tag Frau/Herr Nachname, ich bin …`; informelle Inserate verwenden `Hallo Vorname, ich bin …`.
- Fehlt im Inserat ein eindeutiges du-/Sie-Signal, gilt bei einer klaren Person die formelle Ansprache als sicherer Standard.
- Nur wenn keine persönliche Bewerbungskontaktperson sicher identifiziert ist, bleibt das Kurzprofil ohne Anrede.
- Die Anrede ist Teil der automatischen Vier-Zeilen-Auswahl: Der längste passende Kurzprofil-Kandidat wird inklusive Anrede gewählt. Schriftgrösse, Abstände und Layout dürfen dafür nicht verändert werden.

## Verbotene Abkürzungen

- Kein Rückgriff auf alte Branches oder PRs als Ganzes.
- Kein ad-hoc PDF-Layout ausserhalb der kanonischen Renderer.
- Keine erfundenen Kenntnisse, Kontakte, Firmenangaben oder Referenznummern.
- Keine Änderung der gesperrten Layoutdateien während einer Bewerbung.
- Keine komplette Vier-Varianten-Render-Suite während eines normalen Bewerbungslaufs.
