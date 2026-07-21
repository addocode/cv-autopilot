# CODEX IMPLEMENTATION TASK - Motivation-Letter Creator v1

## Ziel

Implementiere den Motivationsschreiben-Generator so, dass jeder Stelleninserat-Workflow chatunabhängig und später in der Web-App automatisch ein Schreiben im verbindlichen FK-Goldstandard erzeugt.

## Autoritative Dateien

Vor jeder Implementierung vollständig lesen und als Source of Truth behandeln:

1. `modules/motivation-letter/APPROVED_GOLDEN_STANDARD.md`
2. `modules/motivation-letter/layout-reference.json`
3. `modules/motivation-letter/README.md`
4. `modules/motivation-letter/guidance-sources.json`
5. `modules/motivation-letter/tests/fixtures/admin-sachbearbeiter-fk-golden.json`
6. `modules/motivation-letter/tests/fixtures/transgourmet-junior-digital-marketing-manager.json`
7. Referenzdateien unter `modules/motivation-letter/references/`

Ältere Chat-Ausgaben oder provisorische Layouts dürfen diese Dateien nicht überschreiben.

## Kernanforderung

Ein Stelleninserat erzeugt aus derselben Bewerbungsinstanz:

- individuelle Argumentationsstrategie,
- Motivationsschreiben-HTML,
- genau eine A4-PDF,
- PNG-Vorschau,
- Qualitätsreport.

Das Layout darf nicht frei vom Modell erfunden werden. Das Modell liefert strukturierte Inhalte und Hervorhebungsentscheidungen; Template, Geometrie, Farben, Fonts, Logo, Datum, Referenz und Signatur kommen deterministisch aus dem Renderer.

## Inhaltspipeline

1. Stellenbezeichnung, Arbeitgeber, Kontaktperson, Ansprache, Pensum, Eintritt und Referenz extrahieren.
2. Rollenfamilie bestimmen: direkte Passung, angrenzende Passung, Quereinstieg oder Initiativbewerbung.
3. Zwei bis vier belegte Profilbelege auswählen.
4. Arbeitgeber- und Rollenmotivation formulieren.
5. Zentralen Mehrwert formulieren.
6. Kompetenzlücken explizit und ehrlich behandeln.
7. Langfristigkeit nur bei plausibler Passung verwenden.
8. Zwei bis vier sparsame Hervorhebungsgruppen auswählen.
9. Rendern, Höhe messen und semantisch verlängern oder kürzen.
10. Paket- und Wahrheits-Gates ausführen.

## Strikte Trennung Modell / Renderer

Das Sprachmodell darf nicht erzeugen:

- freie CSS-Werte,
- alternative Farben,
- eigene Logo-Positionen,
- zusätzliche Rahmenflächen,
- Referenz- oder Datumshintergründe,
- freie Schriftgrössen,
- eine zweite Layoutvorlage.

Der Renderer muss alle visuellen Werte ausschliesslich aus `layout-reference.json` laden.

## Golden Tests

### 1. Admin. Sachbearbeiter FK

- Referenz `JRQ$540-19713` sichtbar.
- Quereinstiegsargumentation ehrlich.
- ACTA NOVA und Verwaltungserfahrung zentral.
- Langfristigkeit klar.
- Visuell dem freigegebenen FK-Schreiben entsprechend.

### 2. Transgourmet

- Titel `Bewerbung als Junior Digital Marketing Manager`.
- Keine Referenz und kein leerer Referenzcontainer.
- Anrede `Guten Tag Frau Röthlisberger`.
- Direkte Digital-Marketing-Passung.
- Marketing Automation, Daten und Kampagnenperformance zentral.
- BSI-Erfahrung nicht behaupten; Lücke ausdrücklich und positiv überbrücken.
- HTML/CSS, Newsletter, Webshop, Google Analytics und Stakeholder-Koordination belegen.
- Langfristiger Entwicklungsschritt glaubwürdig.

## Layout-Gates

- exakt eine Seite,
- Brand Blue `#15519F`,
- Body 11 pt / 14 pt,
- Referenz und Datum 8 pt,
- Datum mit Anrede ausgerichtet,
- Textbeginn innerhalb der dynamischen Grenzen,
- Mindestmenge gegenüber ursprünglicher Vorlage um zwei volle Zeilen erhöht,
- Logo exakt gemäss Golden Standard,
- oberer Balken und Rails über die gesamte Länge konstant,
- lokale Rahmenabweichung maximal ein Renderpixel,
- keine Overflows oder Kollisionen,
- Text auswählbar,
- `dolinsky.ch` klickbar.

## Frame Regression

Prüfe die blaue Pixel-/Geometriefläche zeilen- und spaltenweise:

- Top-Bar-Höhe im Referenzbereich identisch mit der restlichen Bar.
- Rail-Breite im Datumsbereich identisch mit dem restlichen Rail.
- Keine Textwrapper mit Background, Border, Outline, Shadow oder Pseudo-Fläche.

## Definition of Done

- Beide Golden Fixtures rendern reproduzierbar.
- Neue Chat-Aufrufe und die spätere Web-App verwenden denselben Generator.
- Kein Chat muss das Layout erneut beschreiben.
- Das Modell kann nur den Inhalt variieren, nicht den Designstandard.
- Bestehende CV-Outputs bleiben unverändert.
