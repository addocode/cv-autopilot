# Chat and Web-App Contract

Every chat, agent and future web-app endpoint that creates a motivation letter must call the same motivation-letter generator and must not compose an alternative PDF layout locally.

## Required execution order

1. Load `APPROVED_GOLDEN_STANDARD.md`.
2. Load `layout-reference.json`.
3. Parse the application context.
4. Produce structured content only.
5. Render through the deterministic motivation-letter template.
6. Run the golden quality gates.
7. Return the PDF only after successful validation.

## Fallback rule

If the generator is unavailable, the system must state that the final MS renderer is unavailable. It must not silently create a differently styled motivation letter and present it as final.

## Versioning

The generated report must contain:

```json
{
  "motivationLetterStandard": "approved-golden-v1",
  "layoutSchemaVersion": 2,
  "contentGuidanceVersion": "2026-07-21.1"
}
```

This contract prevents chat-specific layout drift and ensures the same result can later be used by the web app.
