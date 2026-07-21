# RAV-Recap Autopilot

## Zweck

Dieses Modul erzeugt am Ende jeder Bewerbung einen vollständig ausgefüllten, mobilen RAV-Recap für die Web-App **Job-Room**. Adam soll jedes Pflichtfeld ohne eigene Recherche und möglichst mit einem einzelnen Kopiervorgang pro Feld übertragen können.

Der RAV-Recap ist ein separater Arbeitsschritt nach CV, Motivationsschreiben und Mailanschreiben, gehört aber verbindlich zum vollständigen Bewerbungspaket.

## Ausgaben pro Bewerbung

```text
applications/<applicationId>/
├── 12_rav-recap.html
├── 13_rav-recap.json
├── 14_rav-recap.txt
└── 15_rav-recap-report.json
```

- `12_rav-recap.html`: mobile-first Hauptdokument mit Copy-Buttons.
- `13_rav-recap.json`: maschinenlesbare Datenquelle für Web-App und spätere Automatisierung.
- `14_rav-recap.txt`: robuste Offline-/Fallback-Version.
- `15_rav-recap-report.json`: Quellen, Annahmen und Qualitätsprüfung.

## Pflichtfelder gemäss Job-Room-Formular

### Wann haben Sie sich beworben?

- Datum

### Wie haben Sie sich beworben?

Genau eine Auswahl:

- Elektronisch
- Brieflich
- Persönlich
- Telefonisch

### Wo haben Sie sich beworben?

- Unternehmen
- Strasse
- Nummer
- Postfach-Nummer
- Land
- PLZ / Ort
- Kontaktperson
- E-Mail
- Telefonnummer

### Auf welche Stelle haben Sie sich beworben?

- Stellenbezeichnung
- Link zum Online-Formular beziehungsweise Stelleninserat

### Erfolgte die Bewerbung aufgrund einer Zuweisung des RAV?

- Nein
- Ja

### Für welches Arbeitspensum haben Sie sich beworben?

- Vollzeit
- Teilzeit

### Wie lautet das Ergebnis Ihrer Bewerbung?

- Vorstellungsgespräch
- Noch offen
- Anstellung
- Absage

## Ermittlungsreihenfolge

Jeder Wert erhält einen Herkunftsstatus:

1. `job_ad_explicit` – direkt aus dem Inserat.
2. `official_research` – über offizielle Arbeitgeber-, Karriere-, Kontakt- oder Impressumsseiten recherchiert.
3. `reliable_research` – über eine andere belastbare Quelle recherchiert.
4. `inferred_high_confidence` – aus einem klaren Unternehmensmuster oder dem Bewerbungsvorgang mit hoher Wahrscheinlichkeit abgeleitet.
5. `fallback_required_field` – technisch notwendiger Ersatzwert, damit das Pflichtfeld nicht leer bleibt.

Die Web-Ausgabe zeigt standardmässig nur die einzutragenden Werte. Herkunft und Unsicherheit stehen in einem aufklappbaren Abschnitt, damit das Dokument auf dem Smartphone übersichtlich bleibt.

## Recherche- und Fallbackregeln

### Adresse

- Inseratadresse verwenden, wenn sie der ausgeschriebenen Arbeitsstelle oder Arbeitgeberzentrale entspricht.
- Fehlt sie, zuerst offizielle Stellen-, Kontakt- oder Impressumsseite prüfen.
- Strasse und Hausnummer getrennt speichern.
- Fehlt eine Postfachnummer, wird der Job-Room-kompatible Ersatz `Kein Postfach` verwendet, sofern das Feld tatsächlich nicht leer bleiben darf.

### Kontaktperson

- Namentliche Recruiting- oder Stellenkontaktperson aus dem Inserat bevorzugen.
- Keine fachfremde Kontaktperson erfinden.
- Ist kein Name auffindbar, `Personalabteilung` verwenden.

### E-Mail

Priorität:

1. explizite Recruiting-E-Mail im Inserat,
2. offizielle persönliche E-Mail der genannten Kontaktperson,
3. mit hoher Sicherheit abgeleitete persönliche Firmenadresse,
4. offizielle HR-/Jobs-Adresse,
5. offizielle allgemeine Unternehmensadresse.

Eine abgeleitete persönliche Adresse muss im Report als Annahme markiert werden. Für Adam wird trotzdem der wahrscheinlichste eintragbare Wert ausgegeben, weil das Job-Room-Feld obligatorisch ist.

### Telefonnummer

Priorität:

1. direkte Nummer der Kontaktperson,
2. offizielle HR-/Recruiting-Nummer,
3. offizielle Hauptnummer des Unternehmens oder Standorts.

### Stellenlink

- Direkte Stellen-URL bevorzugen.
- Falls die Bewerbung über einen Weiterleitungslink erfolgt, darf die stabile öffentliche Stellen-URL verwendet werden.
- Keine Suchergebnis-URL speichern.

### Bewerbungskanal

- Bewerbungsportal, E-Mail oder Easy Apply => `Elektronisch`.
- Andere Kanäle nur verwenden, wenn sie tatsächlich benutzt wurden.

### RAV-Zuweisung

- Standardwert `Nein`, ausser die Stelle wurde nachweislich vom RAV zugewiesen.

### Pensum

- Reine 100%-Stelle => `Vollzeit`.
- Reines Pensum unter 100% => `Teilzeit`.
- Bereich mit 100% als Obergrenze, beispielsweise 80–100%, => `Vollzeit`, sofern Adam sich nicht ausdrücklich nur für ein reduziertes Pensum beworben hat.
- Unklare Fälle im Report begründen.

### Ergebnis

- Bei neu eingereichter Bewerbung standardmässig `Noch offen`.
- Später über den Bewerbungsstatus aktualisieren.

## Mobile-First-Darstellung

Das HTML muss ohne externe Bibliotheken funktionieren und folgende Eigenschaften haben:

- responsive ab 320 px Breite,
- grosse, berührungsfreundliche Copy-Buttons,
- jedes Job-Room-Feld in einer eigenen Copy-Box,
- sichtbare Auswahlwerte für Radio- und Checkbox-Felder,
- Button `Alle Werte kopieren`,
- kompakte Transferanleitung,
- Quellen-/Annahmenbereich standardmässig eingeklappt,
- druckbar,
- offline verwendbar,
- keine horizontale Scrollbar,
- UTF-8 und Schweizer Schreibweise.

## Datenvertrag

Die verbindliche Struktur steht in `schema.json`.

## Qualitäts-Gates

Der RAV-Recap gilt nur als vollständig, wenn:

- kein Pflichtfeld leer ist,
- Datum im Format `DD.MM.YYYY` vorliegt,
- Strasse und Hausnummer getrennt sind,
- Land gesetzt ist,
- PLZ und Ort gesetzt sind,
- E-Mail syntaktisch plausibel ist,
- Telefonnummer gesetzt ist,
- Stellenlink eine absolute HTTPS-URL ist,
- genau ein Bewerbungskanal ausgewählt ist,
- RAV-Zuweisung ausgewählt ist,
- Pensum ausgewählt ist,
- Ergebnis ausgewählt ist,
- jede Recherche oder Annahme im Report dokumentiert ist,
- HTML und TXT dieselben Werte enthalten.

## Bewerbungspaket

Der vollständige Paketreport muss prüfen, dass CV, Motivationsschreiben, Mailanschreiben und RAV-Recap dieselbe Firma, Stellenbezeichnung, Kontaktperson und Bewerbungs-ID verwenden.
