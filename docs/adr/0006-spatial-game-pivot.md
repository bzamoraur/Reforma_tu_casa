# ADR 0006 — Spatial game pivot (room-by-room "explore → learn → test → transform")

- Status: Accepted
- Date: 2026-06-28
- Supersedes parts of: 0001 (MVP scope), 0002 (stack — Phaser deferral now resolved)

## Context

The first MVP (Levels 1–3) is a well-made but **quiz-shaped** linear loop (menu → scenario list → audit → scorecard). After playing it, the owner approved the content quality but asked us to "do better" and build **a real game where the player learns while playing**: a character moves into a Madrid flat and, **room by room**, explores, discovers what to renovate, **picks a project**, then a module **teaches → tests → and the room visibly transforms**, until the flat is fully renovated.

A 7-perspective audit (game design, pedagogy, architecture, art/tools, commercial, safety) concluded the vision is the right bar, with the shape **"deep, not wide"**: push the _experience_ ambition, rein in the _engine_ ambition, and prove **one room / one module end-to-end** before scaling. The dominant risk is multiplicative content+art cost; the blocking risk is safety (new interactive strings would bypass today's dangerous-DIY scanner).

## Decisions

1. **Render: keep Phaser, but dynamic-import it** (resolves the ADR-0002 deferral). Phaser renders the isometric rooms (Seedream images as textures) and is lazy-loaded so it never taxes first paint. The HTML/CSS DOM overlay keeps doing module UI (learn/test/feedback). before→after = swap the room texture / layer.
2. **Phase 1 vertical slice = Salón + flooring** (a low-risk project): a clear, dramatic before/after that proves the whole loop without the strictest safety gate. Lighting (high-risk) comes after the loop is proven.
3. **Transform gate = hard gate + retry**: passing requires the recommended choice; a wrong pick shows the existing lesson/`betterQuestion` feedback and lets the player retry. Mastery is real; nobody is walled out.
4. **Navigation = rooms + a parallel "process/whole-flat" track** for cross-cutting content (contracting, planning, handover) that does not belong to one physical room. The Recibidor bridges the two.
5. **Art = self-served Seedream 4.0** (free, unlimited on the website), with prompts authored here. before/after alignment via Seedream's **in-context edit** (generate "after" from "before"). Higgsfield (ADR-0005) remains auxiliary and is parked until credits recharge. **All generated art is tracked in `src/content/assets/assets-register.json` + `docs/CREDITS.md`; commercial-use/ownership terms must be confirmed before ship.**

## Spatial content model (additive, above the proven item core)

New files `src/domain/spatial-types.ts` + `spatial-schema.ts` (Zod `strict()`), so existing level JSON stays valid:

- **House → Room** `{ id, name, isoArt(before/after layer refs), projectIds, hotspots }`
- **Hotspot** `{ id, roomId, label, position, discoverHint, projectId }`
- **Project (= the module)** `{ id, roomId, title, opportunity, steps[], visualState{before,after}, prerequisites[], category, riskLevel, playerRole, professionalRouting? }`
- **Step** = tagged union: `{kind:'learn', body, sourceIds}` → `{kind:'decide', …existing ContentItem/PlayerChoice verbatim…}` → `{kind:'test', questions[]}`.

Reusing `ContentItem` as the `decide` payload means `scoring.ts`, red-flags, `acceptanceChecks`, and `content-safety` keep working unchanged. **Wrap, don't rewrite.**

## Safety invariants (must land WITH the schema, not after)

- **`playerRole` enum** with NO execution value for regulated trades: `'decide' | 'choose_design' | 'supervise' | 'inspect' | 'audit' | 'document' | 'simple_safe_diy'`. Executing regulated work is **unrepresentable**, so it cannot be authored.
- **`roomChange.agent`**: at/above a risk floor the linter forces `'professional'` and a caption attributing the result to the hired trade ("el electricista deja los puntos donde los planificaste").
- **`collectModuleText()`** in `content-lint.ts` concatenates EVERY new player-facing string (step prompts, option labels, tooltips, test items, success + room-change captions) and runs `scanForbidden` over it, exactly as `collectItemText` does today. Golden MUST_CATCH / MUST_PASS cases ship in the same change.
- Risk floors extended to project categories (lighting/electrical, plumbing); a transformed room is **game state, never `expert_verified`**.

## DEFER (explicitly not now)

Free-roam avatar/locomotion · pathfinding · depth-sorted dynamic scenes · 3D · procedural generation · animated tweened transforms (a layer swap is enough) · accounts/payments/analytics · any quantitative "design/building calculator" (placement stays a qualitative PLAN/BRIEF for the professional) · shipping AI-generated scene art without provenance + commercial-terms confirmation.

## Consequences

- Phase 0 (this) records decisions + scaffolds asset provenance. Phase 1 proves the loop on one room. Phases 2–4 add depth, a second room driven purely by data, then fill the flat behind expert review.
- Test migration is real: golden snapshots + e2e encode the linear flow and will be deliberately rewritten (gate stays green; tests are not weakened).
- `PROGRESS_VERSION` bumps to 2 (old saves reset gracefully — acceptable, no accounts).
