# APPROVED GOLDEN STANDARD - Motivationsschreiben

## Verbindlichkeit

Diese Datei ist die chatübergreifende und spätere Web-App-Referenz für **jedes** von Adam Dolinsky erzeugte Motivationsschreiben.

Der final freigegebene Live-Test **«Bewerbung als Admin. Sachbearbeiter FK»** ist der verbindliche Goldstandard. Neue Schreiben dürfen den Inhalt selbstverständlich vollständig an die jeweilige Stelle anpassen, müssen aber dieselbe visuelle Sprache, denselben Qualitätsanspruch und dieselbe technische Geometrie verwenden.

Bei Widersprüchen zwischen älteren Chats, Beispielbriefen, provisorischen PDFs oder früheren technischen Notizen gilt:

1. `APPROVED_GOLDEN_STANDARD.md`
2. `layout-reference.json`
3. die aktuelle Referenz-PDF und `ad_logo.png` unter `modules/motivation-letter/references/`
4. erst danach ältere Spezifikationen

## Unveränderlicher visueller Standard

- A4, genau eine Seite.
- Vollflächiges Schreibtisch-Hintergrundbild wie beim freigegebenen FK-Schreiben.
- Durchgehender blauer Rahmen in exakt demselben Blau wie der CV: `#15519F`.
- Weisse Inhaltsfläche innerhalb des Rahmens.
- A-Logo aus `references/ad_logo.png` exakt in der freigegebenen Position; keine automatische Zentrierung.
- Titel rechtsbündig in Roboto Slab Bold, grundsätzlich zweizeilig möglich.
- Titel beginnt immer mit `Bewerbung als`.
- Pensum wird im Titel entfernt.
- Stellenbezeichnung wird für Adam sinnvoll in der männlichen Form ausgegeben; neutrale Titel bleiben neutral.
- Body in Arial 11 pt beziehungsweise metrisch kompatiblem Arimo, 14 pt Zeilenhöhe.
- Ort und Generierungsdatum vertikal im linken Rail, 8 pt Roboto Slab Bold.
- Datum wird mit der ersten sichtbaren Zeile der Anrede ausgerichtet und bewegt sich mit der dynamischen Textlänge.
- Referenz wird nur bei einer explizit erkannten Stellen-/Job-/Requisition-ID ausgegeben, 8 pt Roboto Slab Bold.
- Ohne sichere Referenz bleibt das Element vollständig unsichtbar; es wird keine leere Box gerendert.
- Signatur bleibt unten verankert: `Adam Dolinsky.ch`, wobei `Dolinsky` schwarz fett und `.ch` blau fett ist.
- `dolinsky.ch` bleibt klickbar.

## Zwingende Rahmenregel

Der obere Querbalken und beide Seitenrails werden ausschliesslich durch die kontinuierlichen Grundflächen des Rahmens gezeichnet.

Die Wrapper von `Referenz` und `Bern, DD.MM.YYYY` müssen vollständig transparent sein:

```css
background: transparent;
border: 0;
outline: 0;
box-shadow: none;
padding: 0;
```

Keine lokalen blauen Rechtecke, Pseudo-Elemente oder Hintergrundflächen sind erlaubt. Der Balken darf im Bereich von Referenz oder Datum nicht dicker, breiter oder ausgebuchtet wirken. Geometrische Abweichung: maximal ein Renderpixel.

## Dynamische Länge

- Der Textblock ist unten verankert und wächst nach oben.
- Die ursprünglich rote Mindestgrenze wurde verbindlich um zwei volle 14-pt-Zeilen erhöht.
- Die rote und grüne Linie sind reine Diagnoseelemente und erscheinen nie im finalen PDF.
- Die tatsächliche Renderhöhe ist verbindlicher als eine reine Wortzahl.
- Zielbereich für den Erstentwurf: ungefähr 300 bis 340 Wörter inklusive Anrede und Schluss; Abweichungen sind erlaubt, wenn der Render innerhalb der Geometrie bleibt und der Text dadurch stärker wird.
- Zu kurze Texte werden durch echten Stellenbezug, einen zusätzlichen konkreten Beleg oder einen plausiblen Mehrwert ergänzt.
- Zu lange Texte werden semantisch gekürzt. Keine Schriftverkleinerung, keine Kompression und kein Abschneiden.

## Verbindlicher Schreibstandard

Jedes Schreiben muss eigenständig und stellenbezogen argumentieren. Es ist kein Serienbrief und keine leicht umformulierte CV-Zusammenfassung.

Es beantwortet mindestens:

1. Weshalb genau diese Stelle und dieser Arbeitgeber?
2. Welche konkreten, belegten Erfahrungen passen am stärksten?
3. Welchen Nutzen bringt Adam in den ersten Monaten?
4. Wie werden vorhandene Lücken ehrlich und überzeugend behandelt?
5. Weshalb ist die Motivation glaubwürdig und - sofern passend - langfristig?

### Direkte Passung

Bei Marketing-, Mediamatik-, Content-, Web- oder Kommunikationsstellen:

- sofort die konkrete fachliche Verbindung zeigen,
- zwei bis vier starke Praxisbelege auswählen,
- den möglichen Beitrag zu Kampagnen, Systemen, Prozessen oder Inhalten beschreiben,
- Portfolio oder Weiterbildung nur bei echter Relevanz erwähnen.

### Quereinstieg

Bei Administration, Bund, Kanton, GEVER oder Sachbearbeitung:

- nicht defensiv mit fehlender KV-Ausbildung beginnen,
- echte Hin-zu-Motivation zeigen,
- ACTA NOVA, Geschäftsvorgänge, Dokumentenmanagement, Qualitätssicherung, MS Office, Koordination und Berufsmaturität als übertragbare Belege einsetzen,
- Marketing als Zusatznutzen und nicht als eigentliches Ziel darstellen,
- langfristige Motivation ausdrücklich erklären, wenn sie plausibel ist.

### Kompetenzlücken

- Keine Software- oder Führungserfahrung erfinden.
- Eine fehlende direkte Erfahrung klar und knapp benennen, wenn sie zentral ist.
- Danach die vorhandene technische Grundlage, Lernfähigkeit und passende Transfererfahrung konkret zeigen.
- Eine ehrliche Lücke darf niemals mit einer generischen Floskel kaschiert werden.

## Hervorhebungen

- Zwei bis vier blau-fette Hervorhebungsgruppen.
- Höchstens eine Gruppe pro Absatz.
- Keine ganzen Sätze.
- Priorität: Stellenbezeichnung, stärkster Abschluss/Skill/Systembezug, besonderer Praxisbeleg, glaubwürdiger langfristiger Entwicklungssatz.
- Hervorhebungen müssen inhaltlich begründet und visuell sparsam bleiben.

## Anrede

- Inserat in Sie-Form und namentliche Kontaktperson: `Sehr geehrte Frau ...` / `Sehr geehrter Herr ...`.
- Inserat in Du-Form und namentliche Kontaktperson: grundsätzlich `Guten Tag Frau ...` / `Guten Tag Herr ...`, sofern kein persönliches Du eindeutig angeboten wird.
- Keine sichere Kontaktperson: neutrale, professionelle Anrede ohne erfundenen Namen.

## Qualitäts-Gates

Ein Motivationsschreiben gilt nur als fertig, wenn:

- genau eine A4-Seite vorhanden ist,
- keine Überläufe oder Kollisionen bestehen,
- Text vollständig auswählbar ist,
- Links funktionieren,
- Datum und Anrede bündig sind,
- Referenz korrekt erkannt oder vollständig ausgeblendet ist,
- Titel korrekt bereinigt ist,
- zwei bis vier Hervorhebungsgruppen verwendet werden,
- keine unbelegte Aussage enthalten ist,
- kein Textrest einer früheren Bewerbung vorkommt,
- Rahmen und Rails durchgehend einheitlich sind,
- der visuelle Eindruck dem FK-Goldstandard entspricht.

## Verbindlicher Regressionstest

Jede spätere Implementierung und Web-App muss mindestens zwei goldene Render-Fälle prüfen:

1. **Admin. Sachbearbeiter FK** - Quereinstieg, Referenz sichtbar, langfristige Verwaltungsargumentation.
2. **Junior Digital Marketing Manager Transgourmet** - direkte Marketingpassung, keine Referenz, ehrlicher BSI-Gap, Marketing-Automation- und Datenbezug.

Bei beiden muss das gleiche Layoutsystem verwendet werden. Ein neuer Chat darf nicht selbst ein alternatives MS-Layout erfinden.
