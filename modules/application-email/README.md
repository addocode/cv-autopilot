# Mailanschreiben Autopilot

## Zweck

Dieses Modul erzeugt das kurze Begleitmail für eine Bewerbung. Es ist kein zweites Motivationsschreiben und darf den PDF-Text nicht wiederholen.

Es verwendet dieselbe Bewerbungsinstanz, dieselbe Kontaktperson, dieselbe Stellenbezeichnung und dieselbe dokumentübergreifende Strategie wie CV und Motivationsschreiben.

## Ausgabe

```text
applications/<applicationId>/10_mailanschreiben.md
```

Beispielstruktur:

```markdown
---
application_id: "..."
to: "..."
subject: "Bewerbung als Sachbearbeiter Administration"
contact_name: "..."
status: "draft"
---

Sehr geehrte Frau Muster

Im Anhang sende ich Ihnen meine Bewerbungsunterlagen für die Position als Sachbearbeiter Administration. Die Verbindung aus digitaler Geschäftsvorgangsbearbeitung, strukturierten Abläufen und einem Umfeld mit gesellschaftlichem Auftrag spricht mich besonders an.

Gerne erläutere ich Ihnen in einem persönlichen Gespräch, wie ich meine Erfahrung mit ACTA NOVA, Dokumentenmanagement und digitalen Prozessen in Ihrem Team einbringen kann.

Freundliche Grüsse
Adam Dolinsky
```

## Regeln

- Betreff beginnt grundsätzlich mit `Bewerbung als` und nutzt dieselbe bereinigte Stellenbezeichnung wie das Motivationsschreiben.
- Bei einer expliziten Referenz kann sie im Betreff ergänzt werden, sofern dadurch der Betreff nicht unübersichtlich wird.
- Richtige Sie-/Du-Ansprache aus dem Anwendungskontext verwenden.
- Zwei bis vier kurze Absätze.
- In der Regel ungefähr 55 bis 110 Wörter.
- Keine Aufzählung sämtlicher Beilagen, sofern das Bewerbungsportal oder die E-Mail-Situation dies nicht erfordert.
- Keine Wiederholung ganzer Sätze aus dem Motivationsschreiben.
- Höchstens ein zentraler Profilbeleg.
- Portfolio-Link nur, wenn er für die Stelle relevant ist und nicht bereits unnötig mehrfach genannt wird.
- Eintritt, Pensum oder Weiterbildung nur nennen, wenn dies für die Übermittlung wichtig ist.
- Keine unbelegten Aussagen.
- Keine automatische Empfängeradresse erraten und versenden. Eine geschätzte Recruiter-Adresse darf nur als Review-Vorschlag markiert werden.
- Status bleibt `draft`; Versand erfolgt nur nach ausdrücklicher Freigabe.

## Varianten

### E-Mail mit vollständigem Bewerbungsdossier

- Hinweis auf angehängte Unterlagen.
- Ein konkreter Motivationssatz.
- Ein zentraler Mehrwertsatz.
- Gesprächswunsch.

### Bewerbungsportal mit Freitextfeld

- Kein Hinweis auf E-Mail-Anhang, sofern nicht passend.
- Text an Zeichenlimit anpassen.
- Der Inhalt kann stärker motivationsorientiert sein, wenn kein separates Motivationsschreiben hochgeladen werden kann.

### LinkedIn Easy Apply

- Feldspezifische Kurzfassung.
- Keine postalische Briefsprache.
- Zeichenlimit und bereits vorhandene Profilinformationen berücksichtigen.

### Initiativbewerbung

- Präziser Anlass und gewünschter Einsatzbereich.
- Keine vage Rundumbewerbung.
- Hinweis auf Flexibilität nur mit klarer fachlicher Klammer.

## Qualitätsreport

Das Mail wird im gemeinsamen Paketreport geprüft:

- Betreff und Stellenbezeichnung korrekt,
- Kontaktperson und Ansprache korrekt,
- Referenz korrekt oder weggelassen,
- Empfängeradresse explizit belegt oder als Review markiert,
- keine Textduplikate aus dem Motivationsschreiben,
- keine unbelegten Aussagen,
- Wort-/Zeichenlimit eingehalten,
- Anhänge stimmen mit den tatsächlich erzeugten Dateien überein,
- Status ist `draft`,
- kein automatischer Versand.
