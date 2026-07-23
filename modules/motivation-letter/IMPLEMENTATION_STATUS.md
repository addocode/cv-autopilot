# Motivation-Letter Creator - Implementation Status

## 2026-07-23

The approved specification, golden layout, two golden fixtures and approved Transgourmet copy are stored in the repository.

Authoritative files:

- `APPROVED_GOLDEN_STANDARD.md`
- `layout-reference.json`
- `CODEX_IMPLEMENTATION_TASK.md`
- `tests/fixtures/admin-sachbearbeiter-fk-golden.json`
- `tests/fixtures/transgourmet-junior-digital-marketing-manager.json`
- `tests/fixtures/transgourmet-approved-copy.md`

The deterministic Playwright renderer, structured content contract, shared application strategy and combined package workflow are implemented on `integration/application-package-v1`.

`scripts/create-application.mjs` now creates the motivation-letter PDF, portable HTML preview and report from the same application context as the CV, email and RAV recap. Layout files and the approved `ad_logo.png` are protected by `layout-lock.json`.

The future web app must call this existing generator. It must not introduce another motivation-letter template.
