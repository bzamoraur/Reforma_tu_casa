# ADR 0001 — MVP scope

- Status: Accepted
- Date: 2026-06-28

## Context

The product is an educational game about renovating a flat in Madrid. We must ship a useful, testable, maintainable MVP without over-scoping.

## Decision

Build an isometric-lite, level-based web adventure with five levels, of which **Level 1 ("Before signing the quote") is implemented end-to-end** and Levels 2–5 ship as locked stubs. The core loop is: inspect → choose → consequence → score (Safety/Quality/Budget/Time/Knowledge/Trust) → unlock learning cards → produce an audit checklist. Out of scope for the MVP: accounts, payments, multiplayer, marketplace, real-time AI, 3D, procedural generation, backend, real legal advice, price engines, and high-risk execution instructions.

## Consequences

- Fast path to a playable, demoable slice; remaining levels become available by authoring content and flipping `available: true`.
- Forces clean separation of content (data) from engine (code).
- Full scope detail lives in `docs/mvp-scope.md`.
