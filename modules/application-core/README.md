# Application Core

Dieses Modul ist die gemeinsame Daten- und Strategieebene für CV, Motivationsschreiben, Mail und RAV-Recap.

## Verträge

`01_application-context.json` enthält ausschliesslich Stellen- und Bewerbungsfakten:

- Bewerbungs-ID und Datum,
- Arbeitgeber und Arbeitsort,
- originale und bereinigte Stellenbezeichnung,
- Pensum und Eintritt,
- Fach- und Bewerbungskontakt,
- explizite Referenznummer,
- Anforderungen und ATS-Begriffe,
- Quellen- und Evidenzstatus,
- offizielle Arbeitgeberrecherche.

`06_application-strategy.json` enthält die dokumentübergreifende Argumentation:

- Rollenfamilie,
- Positionierung,
- Rollen- und Arbeitgebermotivation,
- Mehrwertthese,
- ausgewählte Profilbelege,
- ehrliches Gap-Handling,
- Langfristigkeit,
- Portfolio-/Weiterbildungsentscheidung,
- optional strukturierte MS- und Mail-Inhalte.

## Strukturierter Text aus ChatGPT oder Web-App

Der optionale `--package-input` hat diese Form:

```json
{
  "strategy": {
    "roleFamily": "administration-gever",
    "employerMotivation": "Konkrete, quellengestützte Motivation.",
    "selectedEvidenceIds": [
      "bullet-rs-acta-nova",
      "bullet-rs-quality"
    ],
    "letterContent": {
      "paragraphs": [
        {
          "purpose": "role-and-employer-motivation",
          "text": "Vollständiger Absatz mit einer gezielten Hervorhebung.",
          "emphasis": "gezielten Hervorhebung",
          "evidenceIds": ["job-ad:<applicationId>"]
        }
      ]
    }
  },
  "rav": {
    "schemaVersion": 1,
    "applicationId": "...",
    "applicationDate": "23.07.2026"
  }
}
```

Jeder MS-Absatz braucht mindestens eine Beleg-ID. Zulässig sind ausgewählte Profilbelege, `job-ad:<applicationId>` und gespeicherte `company-source:*`-Quellen. Der Renderer akzeptiert keine HTML-Fragmente und keine Layoutwerte aus dem Modell.

Der `rav`-Block folgt vollständig `modules/rav-recap/schema.json`.
