# APPROVED GOLDEN STANDARD – RAV-Recap

## Verbindlichkeit

Dieses Dokument ist die chatübergreifende und spätere Web-App-Referenz für jeden RAV-Recap. Der von Adam freigegebene Transgourmet-Recap ist der visuelle und funktionale Goldstandard.

Neue Recaps verändern nur die Bewerbungsdaten, Quellen, Annahmen und Anweisungen. Struktur, Gestaltung, Interaktionen und mobile Darstellung stammen immer aus `mobile-template.html`.

## Unveränderliches HTML-Framework

- eigenständige UTF-8-HTML-Datei ohne externe Bibliotheken,
- Schweizer Spracheinstellung `de-CH`,
- responsive ab 320 px,
- maximale Inhaltsbreite 760 px,
- CV-Blau `#15519F`,
- blauer Verlauf im Kopfbereich,
- Kartenstruktur mit drei nummerierten Bereichen,
- jedes Job-Room-Feld in einer eigenen Zeile und Copy-Box,
- grosse Copy-Buttons mit visuellem Erfolgszustand,
- grünes Häkchen für Auswahlfelder,
- Badge `Best-Effort` für abgeleitete Werte,
- Button `Alle Werte kopieren`,
- Button `Drucken / als PDF sichern`,
- eingeklappter Bereich `Anweisungen und Annahmen`,
- offline funktionierende Clipboard-Fallback-Logik,
- keine horizontale Scrollbar,
- druckbare Darstellung,
- Safe-Area-Unterstützung auf Smartphones.

Die verbindliche Implementierung steht in `mobile-template.html`. Kein Chat und keine Web-App darf ein alternatives RAV-Recap-Layout erzeugen.

## Datenregeln

Alle Pflichtfelder des Job-Room-Formulars müssen einen Wert enthalten. Die Ermittlungsreihenfolge und Fallbackregeln stehen in `README.md` und `schema.json`.

Besonders wichtig:

- Strasse und Hausnummer getrennt,
- fehlendes Postfach als `Kein Postfach`, wenn Job-Room keinen leeren Wert akzeptiert,
- Kontaktperson aus dem Inserat bevorzugen,
- persönliche oder funktionale offizielle E-Mail vor allgemeiner Firmenadresse,
- Unsicherheiten sichtbar als `Best-Effort` kennzeichnen,
- bei Pensum bis 100% grundsätzlich `Vollzeit`, sofern Adam nicht ausdrücklich Teilzeit gewählt hat,
- reine Stellen unter 100% als `Teilzeit`,
- neue Bewerbungen als `Noch offen`,
- RAV-Zuweisung standardmässig `Nein`, sofern keine Zuweisung vorliegt.

## Dateien im Bewerbungspaket

```text
12_rav-recap.html
13_rav-recap.json
14_rav-recap.txt
15_rav-recap-report.json
```

HTML ist die mobile Hauptausgabe. JSON ist die Datenquelle für Automatisierung und Web-App. TXT ist der robuste Fallback. Der Report dokumentiert Quellen, Annahmen und Qualitäts-Gates.

## Künftige Web-App-Unterseiten

Sobald die Web-App produktiv ist, wird jeder Recap zusätzlich als eigene Unterseite veröffentlicht, beispielsweise:

```text
/applications/<applicationId>/rav-recap/
```

oder als statische Datei:

```text
public/applications/<applicationId>/rav-recap/index.html
```

Die Seite muss dieselbe Vorlage verwenden wie die herunterladbare HTML-Datei. Die Bewerbung bleibt in der zentralen Bewerbungsakte gespeichert; es gibt keine zweite, abweichende Web-Vorlage.

## Qualitäts-Gates

Ein Recap ist nur fertig, wenn:

- kein Pflichtfeld leer ist,
- HTML, JSON und TXT dieselben Werte enthalten,
- jede Copy-Schaltfläche auf dem Smartphone funktioniert,
- `Alle Werte kopieren` funktioniert,
- das Dokument offline öffnet,
- die Ansicht bei 320, 390, 620 und 760 px ohne horizontales Scrollen funktioniert,
- alle Annahmen im Report dokumentiert sind,
- die direkte Stellen-URL verwendet wird,
- Firma, Stelle, Kontaktperson und Bewerbungs-ID mit CV, MS und Mail übereinstimmen.
