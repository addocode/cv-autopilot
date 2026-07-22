# Motivationsschreiben: verbindlicher Layoutvertrag

## Zweck

Alle Motivationsschreiben werden ausschliesslich mit `scripts/render-motivation-letter.mjs` aus strukturierten JSON-Daten gerendert. PDF, PNG-Vorschau, HTML und Qualitätsreport entstehen aus demselben HTML-/CSS-Dokument über Playwright/Chromium.

Ein ad-hoc erzeugtes PDF – insbesondere mit ReportLab, Canvas-Koordinaten, Bild-Overlays oder einem separaten Textsatzsystem – ist kein zulässiges Produktionsartefakt.

## Referenzgeometrie

Die Werte wurden anhand der bestehenden Word-/PDF-Referenzdokumente wie `1_Motivationsschreiben_Adam-Dolinsky_hep(1).pdf`, `..._asut.pdf`, `..._RIWAX.pdf` und `..._WESTWIND.pdf` festgelegt.

| Element | Verbindlicher Wert |
|---|---:|
| Seite | A4, 210 × 297 mm, keine Seitenränder |
| Hintergrund | `assets/bg_img.jpeg`, `cover`, `left top`, volle A4-Seite |
| Blauer Rahmen | links/rechts 10 mm, oben 14.5 mm, unten 0 mm |
| Weisses Papierfeld | links/rechts 20 mm, oben 24.5 mm, unten 0 mm |
| Inhaltsbereich | links/rechts 28 mm, oben 28.9 mm, unten 14.8 mm |
| Titel | Roboto Slab/Rockwell-Fallback, 15.96 pt, fett, rechtsbündig |
| Fliesstext | Aptos/Segoe UI/Arial/Liberation-Sans-Fallback, 12 pt |
| Zeilenhöhe | 1.41 |
| Normaler Absatzabstand | 2.85 mm |
| Abstand nach der Anrede | 8.8 mm |
| Seitenlabel | weiss, fett, um −90° gedreht, im linken blauen Steg |
| Signatur | am unteren Referenzanker; `Adam Dolinsky.ch` mit differenzierter Linkgestaltung |

## Titelzeilen

Der Titel wird als `titleLines` mit einer oder zwei manuell geprüften Zeilen übergeben. Der Browser darf die Klammer mit dem Pensum nicht mitten im Ausdruck umbrechen. Lange Titel werden logisch getrennt, beispielsweise:

```json
{
  "titleLines": [
    "Bewerbung als (Junior) Digital Marketing",
    "Managerin / Manager (80–100%)"
  ]
}
```

Der Titel ist **rechtsbündig**, nicht zentriert. Die Stellenbezeichnung ist exakt aus dem Inserat zu übernehmen; eigenmächtige Kürzungen wie nur «Manager» statt «Managerin / Manager» sind nicht zulässig.

## Inhalt und Hervorhebungen

Absätze bestehen aus strukturierten `runs`. Nur belegte, strategisch wichtige Begriffe werden fett gesetzt. HTML-Fragmente im Eingabe-JSON sind nicht erlaubt.

```json
{
  "runs": [
    { "text": "Als ausgebildeter " },
    { "text": "Mediamatiker EFZ mit Berufsmaturität", "bold": true },
    { "text": " bringe ich ..." }
  ]
}
```

## Kein automatisches Verkleinern

Die Referenztypografie von 12 pt darf nie verkleinert werden, um einen zu langen Text auf eine Seite zu pressen. Bei Überlauf muss der Inhalt redaktionell gekürzt werden. Der Renderer weist Eingaben über dem konfigurierten Wortbudget zurück und prüft zusätzlich den real gemessenen Abstand zwischen letztem Absatz und Signatur.

## Verbindliche Qualitätsgates

Ein Produktionsrender ist nur erfolgreich, wenn:

- Playwright als Renderer verwendet wurde;
- genau eine PDF-Seite entstanden ist;
- kein Text überläuft oder abgeschnitten wird;
- kein Element mit der Signatur kollidiert;
- Hintergrund, blauer Rahmen, weisses Papierfeld und Inhaltsbereich den Referenzkoordinaten entsprechen;
- Titelgrösse, Rechtsausrichtung, Fliesstextgrösse und Zeilenhöhe stimmen;
- Titelzeilen der expliziten Eingabe entsprechen;
- die Anrede den vergrösserten Referenzabstand zum ersten Absatz besitzt;
- alle Pflichtbegriffe im PDF extrahierbar sind;
- der Qualitätsreport `success: true` meldet.

## Erzeugte Artefakte

```text
dist/Motivationsschreiben_Adam-Dolinsky_<id>.pdf
dist/motivation-letter-<id>.png
dist/motivation-letter-<id>-preview.html
dist/motivation-letter-report-<id>.json
dist/motivation-letter-text-<id>.txt
```

## Produktionsbefehl

```bash
npm run render:motivation-letter -- \
  --input tests/fixtures/live-transgourmet-motivation-letter.json

npm run test:motivation-letter
```

## Verbotene Abkürzungen

Folgende Vorgehensweisen dürfen nicht mehr eingesetzt werden:

- ReportLab-/Canvas-Neubau ausserhalb des Repository-Renderers;
- zentrierter Titel;
- vollflächiger blauer Kasten mit zusätzlichem unteren Rand;
- Hintergrundbild mit mittigem oder automatischem Crop statt `left top / cover`;
- schmalerer oder nach rechts verschobener Textblock;
- Fliesstext unter 12 pt;
- automatisch reduzierte Zeilenhöhe oder Absatzabstände;
- vertikales Seitenlabel in der Seitenmitte ohne Referenzanker;
- ungeprüfter automatischer Titelumbruch;
- gekürzte oder umformulierte Stellenbezeichnungen im Titel;
- Export ohne PNG-Sichtprüfung und grünen Qualitätsreport.
