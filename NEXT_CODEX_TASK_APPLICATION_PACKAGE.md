# NEXT CODEX TASK — Gemeinsamer CV-, Motivationsschreiben- und Mail-Workflow

## Status

Diese Datei beschreibt den nächsten grossen Umsetzungsschritt nach Stabilisierung des bestehenden CV-Renderers. Sie ist bewusst **noch nicht** die aktive Review-Aufgabe und darf die derzeitigen `ACTIVE_CODEX_*`-Anweisungen nicht vorzeitig ersetzen.

Arbeite später auf dem dann aktuellen kanonischen Branch. Vor Beginn müssen offene CV-Änderungen konsolidiert und die bestehenden Tests grün sein.

## Verbindliche Spezifikationen

Vor der Umsetzung vollständig lesen:

- `modules/motivation-letter/README.md`
- `modules/motivation-letter/layout-reference.json`
- `modules/motivation-letter/guidance-sources.json`
- `modules/application-email/README.md`
- bestehendes `README.md`
- `scripts/create-application.mjs`
- bestehende Anwendungskontext-Fixtures und Tests

## Ziel

Ein einziger Stelleninserat-Workflow erzeugt in einem Durchlauf:

1. Stellenanalyse und gemeinsame Bewerbungsstrategie,
2. individuell angepassten CV,
3. individuell verfasstes und gerendertes Motivationsschreiben,
4. kurzes Mailanschreiben,
5. dokumentübergreifenden Qualitätsreport,
6. vollständiges deterministisches Bewerbungsarchiv.

Alle Dokumente verwenden dieselbe Bewerbungs-ID, dieselbe Stellenbezeichnung, dieselbe Kontaktperson, dieselben Profilbelege und denselben Faktenstatus.

## Architektur

Die fachlichen Generatoren bleiben getrennt:

```text
existing CV renderer
modules/motivation-letter
modules/application-email
```

Die Orchestrierung bleibt zentral in `scripts/create-application.mjs` oder wird in einen neuen, klar benannten Paket-Orchestrator ausgelagert, den `create-application.mjs` aufruft.

Keine zweite parallele Stellenanalyse implementieren. `01_application-context.json` bleibt die zentrale Inserats- und Kontaktdatenquelle.

Neue gemeinsame Strategie:

```text
06_application-strategy.json
```

Sie enthält mindestens:

- Rollenfamilie,
- Positionierung,
- echte Motivation,
- Arbeitgeberbezug,
- Mehrwertthese,
- ausgewählte Beleg-IDs,
- Gap-Handling,
- Langfristigkeitssignal,
- Portfolio-/KI-/Weiterbildungsentscheidung,
- zugelassene Hervorhebungen,
- Quellen für aktuelle Arbeitgeberaussagen.

## Datenschutz vor Implementierung

Das Repository enthält reale Bewerbungsdaten. Prüfe vor jeder Arbeit die tatsächliche Repository-Sichtbarkeit.

- Keine hochgeladene private PDF-Vorlage, Bewerbungsunterlage oder Kontaktdatei in ein öffentliches Repository committen.
- Die bereitgestellte Vorlage wurde in `layout-reference.json` vermessen; diese nicht personenbezogene Messspezifikation ist die Implementierungsgrundlage.
- Optionale private Referenzdateien müssen ausserhalb von Git oder in einem ausdrücklich ignorierten privaten Pfad liegen.
- Keine API-Schlüssel oder Zugangsdaten committen.

## Umsetzungsschritte

### 1. Anwendungskontext auf Schema v3 erweitern

Ergänze mindestens:

- `jobAd.reference`
- `jobAd.companyResearch`
- `jobAd.jobTitleOriginal`
- `jobAd.jobTitleRendered`
- `generationDate`
- `language`
- `applicationChannel`

Referenzerkennung nur über explizite Labels und sichere Muster. Zahlen ohne Label nicht raten.

### 2. Stellenbezeichnung normalisieren

Implementiere und teste:

- Entfernen von Pensum und Klammerzusätzen, wenn sie nur das Pensum enthalten.
- Für Adam geeignete männliche Form aus `/in`, `:in`, `*in`, `(m/w/d)` oder ausgeschriebener Doppelform.
- Neutrale Titel nicht unnötig verändern.
- Originalwert, Ausgabe und Transformationsregel im Report dokumentieren.
- Ausgabe beginnt im Motivationsschreiben und Mailbetreff immer mit `Bewerbung als`.

### 3. Gemeinsame Strategie erzeugen

Erzeuge `06_application-strategy.json` deterministisch aus:

- Stellenanforderungen,
- CV-Masterdaten,
- Quellen-/Evidence-Status,
- Rollenfamilie,
- Arbeitgeberinformationen,
- bisherigen Bewerbungsregeln.

Die Strategie muss direkte Passung, angrenzende Passung, Quereinstieg und Initiativbewerbung unterschiedlich behandeln.

### 4. Motivationsschreiben-Komposition

Implementiere:

- rollenabhängige Argumentationslogik,
- zwei bis vier belegte Kernbelege,
- glaubwürdige Arbeitgeber- und Rollenmotivation,
- konkrete Mehrwert- und Zukunftsaussage,
- ehrliche Quereinstiegsbrücke,
- optionalen langfristigen Bezug,
- optional Portfolio und AI Business Specialist nur bei Relevanz,
- Schweizer Rechtschreibung,
- Blockliste für generische Floskeln,
- sparsame Hervorhebungsauswahl.

Keine freie Behauptung ohne Source-ID oder sichere Arbeitgeberquelle.

### 5. HTML-/CSS-Template und Renderer

Implementiere ein eigenständiges Motivationsschreiben-Template und Styles innerhalb des Moduls.

Verbindlich:

- A4, genau eine Seite,
- Geometrie aus `layout-reference.json`,
- Hintergrundbild aus bestehenden sicheren Assets wiederverwenden,
- Titel rechtsbündig,
- Referenz bedingt sichtbar,
- Datum automatisch aus Generierungsdatum,
- Datum dynamisch mit der ersten Anredezeile ausrichten,
- Textblock unten verankern und bei längeren Texten nach oben wachsen lassen,
- rote und grüne Linien nur im Diagnosemodus,
- Arial 11 pt / ca. 14 pt Zeilenhöhe,
- Roboto Slab für Titel, Referenz und Datum,
- blau/fette Hervorhebungen mit Budget,
- klickbare und ATS-lesbare Links,
- keine Overflows oder Kollisionen.

### 6. Renderbasierte Längenoptimierung

Implementiere eine begrenzte Revisionsschleife:

1. Text komponieren.
2. Rendern und `bodyStartMm` messen.
3. Liegt der Beginn unterhalb der Mindestlänge, inhaltlich sinnvoll erweitern.
4. Liegt er oberhalb der Maximallänge, schwächere oder doppelte Aussagen kürzen.
5. Erneut rendern.
6. Nach einer festen Maximalzahl von Versuchen bei Nichterfolg mit Review Queue abbrechen.

Kein blindes Abschneiden, keine Schriftverkleinerung des Bodys und kein Fülltext.

### 7. Mailanschreiben erzeugen

Implementiere `10_mailanschreiben.md` nach `modules/application-email/README.md`.

- kurz,
- persönlich,
- professionell,
- keine Kopie des Motivationsschreibens,
- keine automatisch erratene Empfängeradresse,
- Status `draft`.

### 8. Reports und Paket-Guard

Erzeuge:

- `09_motivationsschreiben-report.json`
- `11_application-package-report.json`

Prüfe unter anderem:

- eine MS-Seite,
- zwei CV-Seiten,
- keine Overflows/Collisions,
- korrekte Referenzsichtbarkeit,
- korrektes Datum,
- Datum-/Anrede-Ausrichtung,
- Body-Start innerhalb der unsichtbaren Guides,
- Hervorhebungsbudget,
- Arbeitgeber-/Titel-/Kontaktkonsistenz,
- keine unbelegten Claims,
- CV-/MS-Ergänzung statt Duplikation,
- korrekte Mailmetadaten,
- keine Altlasten anderer Bewerbungen,
- manuelle Schlussfreigabe.

Der gesamte Workflow schlägt fehl, wenn ein Error-Gate verletzt wird.

### 9. Archiv und Manifest erweitern

Ohne bestehende CV-Dateinamen vorerst umzubenennen:

```text
06_application-strategy.json
07_motivationsschreiben.pdf
08_motivationsschreiben-preview.html
09_motivationsschreiben-report.json
10_mailanschreiben.md
11_application-package-report.json
```

`04_manifest.json` nach Erzeugung aller Dateien neu schreiben und alle zusätzlichen Artefakte hashen.

### 10. Tests

Ergänze Unit-, Integrations- und Render-Tests für alle Fälle aus `modules/motivation-letter/README.md`.

Mindestens testen:

- Referenz vorhanden / nicht vorhanden / falsche Zahl,
- Jobtitel mit mehreren Genderformaten,
- direkte Mediamatikerstelle,
- Bundes-Sachbearbeitung als Quereinstieg,
- Initiativbewerbung,
- Portfolio relevant / irrelevant,
- KI-Weiterbildung relevant / irrelevant,
- Minimum-/Maximum-Grenze,
- Datumsausrichtung bei beiden Grenzen,
- generische Floskel wird abgelehnt,
- unsupported claim wird abgelehnt,
- CV-/MS-Widerspruch schlägt fehl,
- Mail dupliziert MS nicht,
- deterministische Wiederholung erzeugt denselben Inhalt und Hash bei fixiertem Timestamp.

## Nicht tun

- Keine Bewerbung automatisch senden.
- Keine Empfängeradresse ohne explizite Freigabe verwenden.
- Keine Kenntnisse erfinden.
- Keine generischen Firmensätze ohne Quelle.
- Keine alten Motivationsschreiben bloss als Textbausteine zusammenkopieren.
- Keine rote oder grüne Hilfslinie im finalen PDF.
- Kein separates, widersprüchliches Profilmodell für das Motivationsschreiben.
- Keine Änderung am bestehenden CV-Layout ohne ausdrücklich belegten gemeinsamen Designentscheid.

## Definition of Done

- Ein CLI-Aufruf mit Stelleninserat erzeugt das vollständige Bewerbungspaket.
- CV, Motivationsschreiben und Mail sind inhaltlich konsistent und quellengestützt.
- Motivationsschreiben entspricht der vermessenen Vorlage und ist genau eine Seite.
- Dynamische Länge, Datumsausrichtung und bedingte Referenz funktionieren nachweislich.
- Sämtliche neuen Tests und bestehenden CV-Tests sind grün.
- README dokumentiert den kombinierten Workflow.
- Eine reale Bewerbung bleibt bis zur manuellen Prüfung im Status `draft`.
