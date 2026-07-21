# CODEX IMPLEMENTATION TASK – RAV-Recap v1

## Ziel

Erweitere den bestehenden Bewerbungspaket-Workflow um einen separaten abschliessenden RAV-Recap-Schritt. Nach CV, Motivationsschreiben und Mailanschreiben werden automatisch mobile HTML-, JSON-, TXT- und Report-Dateien erzeugt.

## Autoritative Dateien

1. `modules/rav-recap/README.md`
2. `modules/rav-recap/schema.json`
3. `modules/rav-recap/mobile-template.html`
4. `modules/rav-recap/tests/fixtures/transgourmet-junior-digital-marketing-manager.json`

## Gemeinsame Datenbasis

Der RAV-Recap muss dieselbe Bewerbungs-ID und denselben `01_application-context.json` beziehungsweise `06_application-strategy.json` verwenden wie CV, Motivationsschreiben und Mail.

Keine zweite widersprüchliche Stellenanalyse implementieren.

## Pipeline

1. Pflichtfelder aus Stelleninserat und Bewerbungsmetadaten übernehmen.
2. Fehlende Arbeitgeberdaten über offizielle Quellen recherchieren.
3. Verbleibende Pflichtfelder gemäss Fallbackregeln befüllen.
4. Jeden Wert mit Herkunftsstatus und Konfidenz protokollieren.
5. JSON gegen `schema.json` validieren.
6. Mobile HTML-Datei aus `mobile-template.html` erzeugen.
7. TXT-Fallback erzeugen.
8. Qualitätsreport erzeugen.
9. Paketmanifest neu erstellen und alle Dateien hashen.

## Neue Paketdateien

```text
12_rav-recap.html
13_rav-recap.json
14_rav-recap.txt
15_rav-recap-report.json
```

Falls im aktuellen Paket bereits spätere Nummern belegt sind, nummeriere deterministisch weiter, ohne bestehende Dateinamen umzubenennen.

## Web-Recherche

- Offizielle Stellen-, Karriere-, Kontakt- und Impressumsseiten priorisieren.
- Rechercheergebnisse inklusive URL und Abrufzeit im Report speichern.
- Persönliche E-Mail-Adressen dürfen nur als Best-Effort-Inferenz ausgegeben werden, wenn ein offizielles Unternehmensmuster ausreichend belegt ist.
- Zusätzlich eine offizielle Fallback-Adresse im Report speichern.
- Keine Felder leer lassen.

## Mobile HTML

- ohne externe Abhängigkeiten,
- offline nutzbar,
- responsive ab 320 px,
- ein Copy-Button pro Feld,
- `Alle Werte kopieren`,
- druckbar,
- keine horizontale Scrollbar,
- Quellen und Annahmen eingeklappt,
- identische Werte wie JSON und TXT.

## Tests

Mindestens:

1. Transgourmet-Fixture vollständig rendern.
2. Inserat mit vollständigen Kontaktdaten.
3. Inserat ohne Adresse – offizielle Recherche erforderlich.
4. Inserat ohne Kontaktperson – `Personalabteilung`.
5. Inserat ohne E-Mail – offizielle allgemeine Adresse.
6. Keine Postfachnummer – `Kein Postfach`.
7. 100% => Vollzeit.
8. 60–80% => Teilzeit.
9. 80–100% => Vollzeit, sofern kein explizit reduziertes Bewerbungspensum.
10. Neu eingereichte Bewerbung => Noch offen.
11. Sämtliche Pflichtfelder befüllt.
12. HTML/JSON/TXT sind wertgleich.
13. Copy-Buttons funktionieren in einem Browser-E2E-Test.
14. Paketreport erkennt Widersprüche zu Firma, Stelle oder Kontaktperson.

## Definition of Done

- Ein einziger Stelleninserat-Workflow erzeugt zusätzlich den kompletten RAV-Recap.
- Adam kann alle Job-Room-Werte auf dem Smartphone feldweise kopieren.
- Kein Pflichtfeld ist leer.
- Annahmen sind transparent im Report, stören aber nicht die kompakte Hauptansicht.
- Bestehende CV- und Motivationsschreiben-Ausgaben bleiben unverändert.
