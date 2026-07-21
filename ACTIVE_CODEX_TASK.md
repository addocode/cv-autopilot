# ACTIVE CODEX TASK — Bewerbungspaket v1: Motivationsschreiben, Mail und Feedback

## Arbeitskontext

Arbeite ausschliesslich im Repository `addocode/cv-autopilot` auf dem bestehenden Branch:

`codex/motivationsschreiben-generator-v1`

Dieser Branch basiert auf dem bereits veröffentlichten CV-Autopilot-v1.0-Stand auf `main`.

- Erstelle keinen weiteren Branch.
- Erstelle keinen verschachtelten Pull Request.
- Merge nichts nach `main`.
- Verändere das bestehende CV-Layout, die vier Varianten, die Masterfakten oder die bestehenden CV-Gates nicht, ausser eine klar belegte gemeinsame Schnittstelle erfordert eine rückwärtskompatible Erweiterung.
- Automatischer Versand von Bewerbungen bleibt ausgeschlossen.
- Reale Bewerbungsdaten bleiben in git-ignorierten Pfaden.

## Pflichtprüfung

1. Führe `git log -1 --format=%H` aus.
2. Vergleiche die Ausgabe mit der im Startprompt genannten erwarteten SHA.
3. Prüfe, dass diese Datei mit `# ACTIVE CODEX TASK — Bewerbungspaket v1` beginnt.
4. Bei Abweichung nichts verändern und ausschliesslich `STALE SNAPSHOT` melden.

---

## Verbindliche Spezifikationen

Lies vor der Implementierung vollständig:

- `NEXT_CODEX_TASK_APPLICATION_PACKAGE.md`
- `modules/motivation-letter/README.md`
- `modules/motivation-letter/layout-reference.json`
- `modules/motivation-letter/guidance-sources.json`
- `modules/application-email/README.md`
- `README.md`
- `scripts/create-application.mjs`
- bestehende Application-/Render-Fixtures und Tests

Diese Dateien sind die fachliche Source of Truth. Bei Widersprüchen gilt diese aktive Aufgabe für Branch-, Release- und Feedbackregeln; die detaillierten Inhalts- und Layoutregeln kommen aus den Modulspezifikationen.

---

# 1. Ziel für diese Umsetzung

Ein einzelner Stelleninserat-Workflow erzeugt in einem Durchlauf ein vollständiges, manuell freizugebendes Bewerbungspaket:

1. bestehende Stellenakte und `01_application-context.json`
2. individuell angepassten CV
3. `06_application-strategy.json`
4. `07_motivationsschreiben.pdf`
5. `08_motivationsschreiben-preview.html`
6. `09_motivationsschreiben-report.json`
7. `10_mailanschreiben.md`
8. `11_application-package-report.json`
9. `12_application-feedback.json`
10. aktualisiertes Manifest, Exportarchiv und SHA-256-Sidecar

CV, Motivationsschreiben und Mail verwenden dieselbe:

- `applicationId`
- Arbeitgeberbezeichnung
- Stellenbezeichnung
- Kontaktperson und Ansprache
- Referenznummer
- Belegbasis
- Gap-Logik
- Rollen- und Arbeitgebermotivation

Kein Dokument darf eine neue unbelegte Tatsache einführen.

---

# 2. Gemeinsame Strategie statt paralleler Textgeneratoren

Implementiere `06_application-strategy.json` als verbindlichen Vertrag vor Motivationsschreiben und Mail.

Mindestens enthalten:

- `schemaVersion`
- `applicationId`
- `roleFamily`
- `fitType`: `direct | adjacent | career-change | initiative`
- `positioning`
- `roleMotivation`
- `employerMotivation`
- `motivationAngle`
- `valueProposition`
- `firstMonthsContribution`
- `selectedEvidenceIds`
- `gapHandling`
- `longTermSignal`
- `portfolioUse`
- `aiTrainingUse`
- `allowedEmphasisTerms`
- `companySources`
- `unsupportedClaimsRejected`
- `reviewQueue`

Die Strategie muss aktiv mitdenken und darf nicht bloss Anforderungen paraphrasieren. Sie soll insbesondere erkennen:

- worin Adams belegbarer Mehrwert liegt;
- weshalb die Stelle ehrlich motiviert;
- wie ein fachfremderer Quereinstieg glaubwürdig erklärt wird;
- ob ein langfristiges Signal sinnvoll und belegbar ist;
- welche CV-Inhalte im Schreiben nicht nochmals wiederholt werden sollen;
- welche Lücken offen und ehrlich überbrückt werden müssen.

---

# 3. Motivationsschreiben-Komposition

Implementiere die Modulstruktur gemäss Spezifikation, mindestens:

```text
modules/motivation-letter/src/
├── strategy.mjs
├── compose.mjs
├── emphasize.mjs
├── template.mjs
├── render.mjs
└── quality-report.mjs
```

Inhaltliche Anforderungen:

- Schweizer Hochdeutsch, kein `ß`.
- Natürlich, persönlich und professionell.
- Kein Standardbrief und keine generischen KI-Floskeln.
- Konkrete Arbeitgeber- und Rollenmotivation.
- Zwei bis vier belegte Kernbelege.
- Klare Mehrwertthese für die ersten Monate.
- Ehrliche Quereinstiegsbrücke bei Administration, Bund, Kanton oder GEVER.
- Marketing bei fachfremderen Rollen als Zusatznutzen, nicht als eigentliches Berufsziel.
- Langfristigkeit nur verwenden, wenn Strategie und Rolle sie plausibel machen.
- Portfolio, KI-Weiterbildung und AI Business Specialist nur bei echter Relevanz.
- Keine erfundenen Kennzahlen, Verantwortungen, Systeme oder Arbeitgeberaussagen.
- Jede substanzielle Aussage muss im Report auf `sourceIds` oder gespeicherte Arbeitgeberquellen zurückgeführt werden.
- `unsupported_rejected` darf nicht in den Text gelangen.
- `inferred_review_required` bleibt ausserhalb des finalen automatischen Texts.

Das Schreiben muss sich vom CV ergänzend abheben und darf dessen Bulletpoints nicht bloss in Fliesstext umwandeln.

---

# 4. Titel, Kontakt und Referenz

- Titel beginnt immer mit `Bewerbung als`.
- Stellenbezeichnung gemäss Spezifikation bereinigen und Transformation reporten.
- Pensum aus dem Titel entfernen.
- Genderformen für Adam korrekt und konservativ normalisieren.
- Referenz nur bei explizitem, sicherem Label sichtbar.
- Zahlen aus Telefonnummern, URLs, Postleitzahlen oder Pensum nie als Referenz interpretieren.
- Sichere formelle, informelle oder neutrale Anrede aus dem gemeinsamen Anwendungskontext.
- Keine Anrede aus einer blossen Fachkontaktperson übernehmen, wenn ein separater Bewerbungskontakt existiert.
- Keine E-Mail-Adresse aus einem Namen ableiten.

---

# 5. Renderer und Layout

Motivationsschreiben als eigenständiges A4-PDF mit exakt einer Seite.

Verbindlich:

- Geometrie aus `layout-reference.json`.
- Bestehende sichere Assets und Markenlogik wiederverwenden.
- Roboto Slab für Titel, Referenz und Datum.
- Arial 11 pt für Body, keine Schriftverkleinerung zur Fehlerkaschierung.
- Textblock unten stabil verankern und bei längerem Text nach oben wachsen lassen.
- Datum dynamisch mit erster Anredezeile ausrichten.
- Referenz vollständig aus DOM entfernen, wenn nicht sicher vorhanden.
- Rote/grüne Guides nur im Diagnosemodus, nie im finalen PDF.
- Zwei bis vier sparsame blau/fette Hervorhebungsgruppen.
- Keine ganzen Sätze hervorheben.
- Links klickbar und ATS-lesbar.
- Keine Overflows oder Kollisionen.

Renderbasierte Längenoptimierung:

1. Text komponieren.
2. Rendern und `bodyStartMm` messen.
3. Bei zu kurzem Schreiben semantisch sinnvollen Beleg oder Mehrwert ergänzen.
4. Bei zu langem Schreiben schwächere Wiederholung oder allgemeinen Satz entfernen.
5. Feste maximale Revisionszahl.
6. Bei Nichterfolg Review Queue und fehlgeschlagenes Gate statt Schriftkompression oder blindem Abschneiden.

---

# 6. Mailanschreiben

Erzeuge `10_mailanschreiben.md` nach `modules/application-email/README.md`.

- Status immer `draft`.
- Zwei bis vier kurze Absätze.
- In der Regel 55–110 Wörter.
- Kein zweites Motivationsschreiben.
- Höchstens ein zentraler Profilbeleg.
- Betreff und bereinigte Stellenbezeichnung identisch zum Motivationsschreiben.
- Referenz nur bei sicherer Erkennung.
- Portal-, E-Mail-, Easy-Apply- und Initiativmodus unterscheiden.
- Keine Empfängeradresse erraten.
- Kein Versand ausführen.

---

# 7. Sichere Lern- und Feedbackschicht

Das System soll aus echten Bewerbungen lernen, ohne Masterfakten oder Texte unkontrolliert selbst umzuschreiben.

Erzeuge pro Bewerbung `12_application-feedback.json` mit mindestens:

```json
{
  "schemaVersion": 1,
  "applicationId": "...",
  "status": "awaiting-review",
  "manualEdits": [],
  "approvedArguments": [],
  "rejectedArguments": [],
  "approvedEvidenceIds": [],
  "rejectedEvidenceIds": [],
  "toneFeedback": "",
  "interviewInvite": null,
  "applicationOutcome": "unknown",
  "employerFeedback": "",
  "lessons": [],
  "eligibleForFutureReuse": false
}
```

Regeln:

- Feedbackdatei liegt nur in `applications/<applicationId>/` und bleibt git-ignoriert.
- Zukünftige Wiederverwendung erfolgt nur für explizit freigegebene Muster mit `eligibleForFutureReuse: true`.
- Kein Outcome darf automatisch als Beweis für eine Fähigkeit interpretiert werden.
- Keine automatische Änderung von `cv.master.json`.
- Keine automatische Übernahme personenbezogener Arbeitgeber- oder Kontaktdaten in andere Bewerbungen.
- Ein optionaler CLI-Parameter darf freigegebene Feedbackdateien einlesen und nur Ton-, Struktur- oder Argumentationspräferenzen beeinflussen.
- Der Report muss nennen, welche Feedbacksignale verwendet oder bewusst ignoriert wurden.

Damit startet das System mit einer kontrollierten Lernhistorie, nicht mit unüberwachtem Selbsttraining.

---

# 8. Paketreport und Archiv

`11_application-package-report.json` prüft mindestens:

- Arbeitgeber, Titel, Kontakt, Referenz und `applicationId` konsistent;
- CV zwei Seiten;
- Motivationsschreiben eine Seite;
- keine Overflows oder Kollisionen;
- ATS-Auslesbarkeit;
- Datum-/Anrede-Ausrichtung;
- Body-Start innerhalb der Guides;
- Hervorhebungsbudget;
- keine unbelegten Claims;
- CV und Motivationsschreiben ergänzen sich;
- Mail dupliziert das Motivationsschreiben nicht;
- korrekte Pensum-/Eintrittswerte;
- keine Altlasten aus anderen Bewerbungen;
- Feedbackdatei vorhanden;
- manuelle Schlussfreigabe erforderlich;
- automatischer Versand deaktiviert.

Aktualisiere `04_manifest.json` erst nach Erzeugung aller Dateien. Archiv und `.sha256`-Sidecar bleiben deterministisch und vollständig.

---

# 9. Tests und Fixtures

Nutze ausschliesslich fiktive Arbeitgeber- und Kontaktdaten in versionierten Tests.

Mindestens automatisieren:

1. direkte Mediamatiker-/Kommunikationsstelle;
2. Bundes-Sachbearbeitung als ehrlicher Quereinstieg mit Referenz;
3. Administration ohne Referenz;
4. informelle Du-Ansprache;
5. kein Kontaktname;
6. lange Stellenbezeichnung mit Genderzeichen und Pensum;
7. mehrere Zahlen ohne echte Referenz;
8. Portfolio relevant und irrelevant;
9. AI Business Specialist relevant und irrelevant;
10. Initiativbewerbung mit Kompetenz-Gap;
11. minimale und maximale Textlänge;
12. Datumsausrichtung an beiden Grenzen;
13. generische Floskel abgelehnt;
14. unsupported claim abgelehnt;
15. CV-/MS-Widerspruch lässt Paketguard scheitern;
16. Mailduplikation wird erkannt;
17. Feedback mit und ohne Freigabe;
18. identischer Input und Timestamp erzeugen deterministische Inhalte und Hashes.

Alle bestehenden CV-Tests müssen grün bleiben.

---

# 10. Definition of Done

Die Umsetzung ist fertig, wenn:

- ein einzelner CLI-Aufruf das vollständige Bewerbungspaket erzeugt;
- CV, Motivationsschreiben und Mail dieselbe Strategie und Belegbasis verwenden;
- das Motivationsschreiben exakt eine Seite umfasst;
- Layout-, ATS-, Wahrheits- und Konsistenzgates grün sind;
- Mail und Feedbackdatei erzeugt werden;
- Manifest, Archiv und Sidecar vollständig und korrekt sind;
- alle bestehenden und neuen Tests grün sind;
- eine reale Bewerbung weiterhin `draft` bleibt;
- kein automatischer Versand erfolgt;
- README den kombinierten Workflow dokumentiert.

## Abschluss

- Committe und pushe alle Änderungen ausschliesslich auf `codex/motivationsschreiben-generator-v1`.
- Erstelle keinen weiteren Branch und keinen verschachtelten PR.
- Berichte Commit-SHA, alle Test-/Render-Exitcodes, erzeugte Dateien, offene Review-Queue und bekannte Einschränkungen.
- Fahre ohne weitere Rückfrage fort.
