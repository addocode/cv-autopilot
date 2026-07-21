# Referenzdateien Motivationsschreiben

Dieses Verzeichnis enthält die kanonischen visuellen Referenzen für den Motivationsschreiben-Renderer.

## Empfohlene Dateien

```text
modules/motivation-letter/references/
├── Motivationsschreiben_Vorlage.pdf
├── logo-alignment-reference.png
├── Motivationsschreiben_Vorlage.idml   # optional, falls vorhanden
└── README.md
```

## Verbindliche Rollen

### `Motivationsschreiben_Vorlage.pdf`

Kanonische Gesamtansicht für:

- Seitenaufbau,
- Titelposition,
- Referenzposition,
- Textspalte,
- Datum im linken Rail,
- Signatur,
- Hintergrund und Rahmen,
- allgemeine visuelle Wirkung.

Die roten und grünen Linien in der Referenz sind reine Entwicklungsgrenzen und dürfen im finalen PDF nicht erscheinen.

### `logo-alignment-reference.png`

Kanonische Detailansicht für das A-Logo:

- als Overlay an der oberen linken Rahmenecke,
- über dem horizontalen blauen Balken,
- über dem linken blauen Seitenrail,
- teilweise über der weissen Inhaltsfläche,
- ohne sichtbaren Abstand zum blauen Querbalken.

Das Bild ist bei Zweifeln zur Logo-Geometrie verbindlicher als eine allgemeine Zentrierungsregel.

### `Motivationsschreiben_Vorlage.idml`

Optional. Eine IDML-Datei ist für technische Vergleiche und spätere Designpflege nützlicher als eine proprietäre INDD-Datei. Der produktive Renderer darf jedoch nicht von Adobe InDesign abhängig werden.

## Ablageregeln

- Dateinamen stabil halten, damit Tests und Dokumentation darauf verweisen können.
- Neue Referenzversionen nicht still überschreiben. Bei wesentlichen Layoutänderungen entweder Git-Historie verwenden oder eine klar benannte Version ergänzen.
- Keine Referenzdatei direkt als Produktions-PDF ausliefern; die finale Bewerbung muss weiterhin vom HTML-/CSS-/Playwright-Renderer erzeugt werden.
- Messwerte und maschinenlesbare Regeln bleiben in `../layout-reference.json`.
- Das produktive Blau ist unabhängig von älteren PDF-Farbwerten immer das CV-Blau `#15519F`.
