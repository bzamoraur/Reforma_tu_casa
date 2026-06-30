---
name: spatial-room-builder
description: Use when adding a new room + renovation module to the spatial game (ADR-0006). Builds ONE room/module end-to-end — content shape, safety invariants, art provenance, and tests — as a single MVP slice. For non-spatial levels use mvp-slice-builder; for the publish gate use content-quality-gate.
---

# Spatial room builder

Add **one** room and **one** renovation module to the spatial game, end-to-end, in a single slice (ADR-0006). Deep, not wide: prove the loop, don't fan out.

## Content shape

A house pack lives in `src/content/rooms/<name>.json` (schema: `src/domain/spatial-schema.ts`, `strict()`), wired into `src/game/systems/content.ts` by adding the import to `rawHousePacks`. Mirror `salon.json` / `dormitorio.json`.

`House → Room → Hotspot → Project (= the MODULE)`:

- **Room** `{ id, name, order, intro, art{before,after}, hotspots[], projectIds[] }`. `order` is unique across rooms (drives navigation + golden).
- **Hotspot** `{ id, label, discoverHint, projectId, x, y }` — `x`/`y` are `0..1` fractions; `projectId` must resolve.
- **Project (module)** = `learn` step (body + `sourceIds`) → `decide` (a **full reused `ContentItem`** verbatim: `playerChoices`, `redFlags`, `legitimateWorkarounds`, `acceptanceChecks`, exactly one `recommended` choice) → `transform` (caption + `agent`). Plus `playerRole`, `category`/`riskLevel` (on `decide`), `prerequisites[]`.

**Wrap, don't rewrite.** The `decide` beat is a normal `ContentItem`, so `scoring.ts`, red-flags, `acceptanceChecks`, and `content-safety` keep working unchanged — do not fork them.

## Safety invariants (must hold, every module)

1. **`playerRole` carries NO execution value** for regulated trades. Pick from `decide | choose_design | supervise | inspect | audit | document | simple_safe_diy`. "The player personally does dangerous work" must stay **unrepresentable** — never widen the enum to author it.
2. **`transform.agent` must be `'professional'`** for any high/critical-risk or dangerous-category module — enforced by `transformMustBeProfessional(category, riskLevel)` in `content-lint.ts`. The caption must attribute the result to the hired trade (e.g. "el electricista deja los puntos donde los planificaste"). Only genuinely low-risk DIY (paint) may use `'player_safe_diy'`.
3. **Every module string is scanned.** `collectModuleText()` concatenates `title`, `opportunity`, `learn.title/body`, `transform.caption`, and `professionalRouting` text; room `intro` and each hotspot `label`/`discoverHint` are scanned too; `decide` runs the full item scan via `lintContentItem`. No player-facing string is exempt from `scanForbidden`.
4. **Content status floor.** Every module's `decide` is `status: "draft"`, `expertReview: { required: true, status: "not_requested" }`, and references **≥1 source**; `learn.sourceIds` is non-empty too. A transformed room is game state — **never** `expert_verified`. High/critical risk also needs a `safetyNotice`.

## Art pipeline

1. **Reuse the locked Seedream style bible** in `docs/art/salon-flooring-prompts.md` (paste the STYLE BIBLE block verbatim; same camera phrase; from the 2nd room on, attach the first finished room as a style reference).
2. Generate **before**, then derive **after** as an **in-context edit** of that exact before so only the changed surface moves and the pair stays pixel-aligned.
3. **Register every asset** in `src/content/assets/assets-register.json` (id, model, `promptRef`, usage, `license: PENDING` until commercial/ownership terms confirmed). Nothing ships without an entry. The room's `art.before`/`art.after` ids **must match** register ids exactly (register-aligned).
4. Placeholder ids resolve to `public/assets/rooms/<roomId>/<assetId>.png`. A coloured-rectangle placeholder is fine to wire the loop before final art lands.

## Required checks

- **Tests** (mirror the salón set):
  - schema — extend `src/tests/spatial-schema.test.ts` (validates the pack; strictness; `0..1` hotspots; both art layers).
  - module-flow / golden — add `src/tests/golden/<room>-golden.test.ts` snapshotting role, category, risk, status, `transform.agent`, trade, recommended pick, red-flags, checks; assert the recommended pick is `bestPossibleScore`. Update `salon-golden.test.ts`'s `house.rooms`/`projects` expectations when the room list changes.
  - if the slice adds a new forbidden phrasing, add a `MUST_CATCH` / `MUST_PASS` case in `content-safety.test.ts` in the **same** change.
- Run `npm run content:lint` — expect **0 errors** — then the full gate (`lint`, `format:check`, `typecheck`, `test`, `content:lint`, `build`).
- **One room / one module per slice.** Land it green before authoring the next.

## Output

A changed-files summary (room JSON + `content.ts` wiring + assets-register entries + tests), the `content:lint` result (0 errors), and confirmation the safety invariants hold. Prefer several small green steps over one large change.
