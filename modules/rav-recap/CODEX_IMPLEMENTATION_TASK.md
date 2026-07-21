# CODEX IMPLEMENTATION TASK – RAV-Recap v1

## Ziel

Erweitere den bestehenden Bewerbungspaket-Workflow um einen separaten abschliessenden RAV-Recap-Schritt. Nach CV, Motivationsschreiben und Mailanschreiben werden automatisch mobile HTML-, JSON-, TXT- und Report-Dateien erzeugt. Sobald die Web-App produktiv ist, wird derselbe Recap zusätzlich als eigene Unterseite veröffentlicht.

## Autoritative Dateien

Vor jeder Implementierung vollständig lesen:

1. `modules/rav-recap/README_CURRENT.md`
2. `modules/rav-recap/APPROVED_GOLDEN_STANDARD.md`
3. `modules/rav-recap/CHAT_AND_WEBAPP_CONTRACT.md`
4. `modules/rav-recap/README.md`
5. `modules/rav-recap/schema.json`
6. `modules/rav-recap/mobile-template.html`
7. `modules/rav-recap/tests/fixtures/transgourmet-junior-digital-marketing-manager.json`
8. `modules/rav-recap/tests/fixtures/admin-sachbearbeiter-fk.json`

Der freigegebene Transgourmet-Recap ist der visuelle und funktionale Goldstandard. Kein Chat, Agent oder Web-Endpunkt darf eine alternative HTML-Struktur erfinden.

## Gemeinsame Datenbasis

Der RAV-Recap muss dieselbe Bewerbungs-ID und denselben `01_application-context.json` beziehungsweise `06_application-strategy.json` verwenden wie CV, Motivationsschreiben und Mail.

Keine zweite widersprüchliche Stellenanalyse implementieren.

## Pipeline

1. Pflichtfelder aus Stelleninserat und Bewerbungsmetadaten übernehmen.
2. Fehlende Arbeitgeberdaten über offizielle Quellen recherchieren.
3. Verbleibende Pflichtfelder gemäss Fallbackregeln befüllen.
4. Jeden Wert mit Herkunftsstatus und Konfidenz protokollieren.
5. JSON gegen `schema.json` validieren.
6. Mobile HTML-Datei ausschliesslich aus `mobile-template.html` erzeugen.
7. TXT-Fallback erzeugen.
8. Qualitätsreport erzeugen.
9. Paketmanifest neu erstellen und alle Dateien hashen.
10. In der Web-App dieselben Daten unter `/applications/<applicationId>/rav-recap/` bereitstellen.

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

## Verbindliches Mobile-HTML

- exakt das Framework aus `mobile-template.html`,
- ohne externe Abhängigkeiten,
- offline nutzbar,
- responsive ab 320 px,
- CV-Blau `#15519F`,
- blauer Header-Verlauf,
- drei nummerierte Karten,
- ein Copy-Button pro Feld,
- sichtbarer Kopiert-Zustand,
- Clipboard-Fallback für lokale Dateien und ältere Browser,
- `Alle Werte kopieren`,
- `Drucken / als PDF sichern`,
- Auswahlwerte mit grünem Häkchen,
- Best-Effort- und Pflichtfeld-Ersatz-Badges,
- Quellen und Annahmen eingeklappt,
- keine horizontale Scrollbar,
- identische Werte wie JSON und TXT.

## Web-App-Unterseite

Sobald die Web-App vorhanden ist:

```text
/applications/<applicationId>/rav-recap/
```

Die Unterseite verwendet denselben Renderer und dieselbe Vorlage wie `12_rav-recap.html`. Es darf keine zweite Web-App-spezifische Gestaltung geben. Eine Änderung des Bewerbungsstatus aktualisiert JSON, Unterseite, TXT und Report gemeinsam.

## Tests

Mindestens:

1. Transgourmet-Fixture vollständig rendern.
2. Admin.-Sachbearbeiter-FK-Fixture vollständig rendern.
3. Inserat mit vollständigen Kontaktdaten.
4. Inserat ohne Adresse – offizielle Recherche erforderlich.
5. Inserat ohne Kontaktperson – `Personalabteilung`.
6. Inserat ohne E-Mail – offizielle allgemeine Adresse.
7. Keine Postfachnummer – `Kein Postfach`.
8. 100% => Vollzeit.
9. 60–80% => Teilzeit.
10. 80–100% => Vollzeit, sofern kein explizit reduziertes Bewerbungspensum.
11. Neu eingereichte Bewerbung => Noch offen.
12. Sämtliche Pflichtfelder befüllt.
13. HTML/JSON/TXT sind wertgleich.
14. Einzelne Copy-Buttons funktionieren in einem Browser-E2E-Test.
15. `Alle Werte kopieren` funktioniert über Clipboard API und Fallback.
16. 320, 390, 620 und 760 px ohne horizontales Scrollen.
17. Paketreport erkennt Widersprüche zu Firma, Stelle oder Kontaktperson.
18. Web-App-Unterseite und Download-HTML sind wert- und layoutgleich.

## Definition of Done

- Ein einziger Stelleninserat-Workflow erzeugt zusätzlich den kompletten RAV-Recap.
- Adam kann alle Job-Room-Werte auf dem Smartphone feldweise kopieren.
- Kein Pflichtfeld ist leer.
- Annahmen sind transparent im Report, stören aber nicht die kompakte Hauptansicht.
- Der freigegebene HTML-Goldstandard wird in Chat, CLI und Web-App identisch verwendet.
- Jede Bewerbung erhält später automatisch eine eigene RAV-Recap-Unterseite.
- Bestehende CV- und Motivationsschreiben-Ausgaben bleiben unverändert.
