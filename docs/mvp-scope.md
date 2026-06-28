# MVP scope

## Product

An **isometric-lite, level-based web adventure** where the player is an inexperienced homeowner renovating a flat in Madrid. The value is practical learning: understand, contract, supervise, and audit a renovation; execute only simple, low-risk DIY when safe.

## Core loop

Enter a stage → inspect a quote/room/claim → choose questions/actions → reveal consequences → gain/lose points across Safety, Quality, Budget, Time, Knowledge, Trust → unlock concise learning cards → produce an audit checklist at the end of the stage.

## Levels

1. **Before signing the quote** — _implemented_ (the vertical slice).
2. Licences, community, planning, and risk map — _stub_.
3. Demolition, measurements, hidden conditions — _stub_.
4. Critical installations (deliberately strictest; no dangerous DIY) — _stub_.
5. Finishes, kitchen, bathroom, delivery, snag list — _stub_.

Stubs are present as `LevelPack`s with `available: false` and no unverified content.

## In scope (MVP)

- Title/menu, start, placeholder apartment scene (Phaser), Level 1 with ≥5 decisions, scoring, feedback, learning-card unlocks, red-flag review, audit checklist, scorecard, LocalStorage progress, tests, CI, build.

## Explicitly out of scope (MVP)

User login, payments, multiplayer, contractor marketplace/recommendations, real-time AI chat, 3D gameplay, procedural apartments, backend/database, real legal advice, building calculations, real price-estimation engine, and any high-risk execution instructions.

## Definition of done (Milestone 1)

Repo initialized; `CLAUDE.md`, `README.md`, ADRs, safety policy, expert-review workflow exist; Level 1 playable end-to-end; content schema + content lint exist; unit tests and build pass; no secrets; no high-risk content marked verified; Higgsfield documented as auxiliary only; GitHub Actions CI exists. Gate commands that must pass: `lint`, `format:check`, `typecheck`, `test`, `content:lint`, `build`.
