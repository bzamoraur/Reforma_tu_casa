# Test plan

## Harnesses

### Unit tests — `npm run test`

Validate the pure domain: scoring (`createInitialScore`, `applyScoreDelta`, `bestPossibleScore`, `rateDimension`, `summarizeScore`), content schema, progress persistence (load/save/reset, version + corruption handling), decision/stage-gate logic (`applyChoice` idempotency + no score drift, completion gating), and the content registry. Also covered: **content-safety** (`content-safety.test.ts` — a must-catch dangerous-DIY corpus + an awareness must-pass corpus + risk-floor rules), the **GameController** orchestration/persistence layer (`game-controller.test.ts` — happy path, error branches, persistence across instances), and the **UIController** loop in jsdom (`ui-controller.test.ts` — menu→scenario→audit→scorecard routing, result marker, gate-disabled finish). Run in a jsdom environment so `localStorage`/DOM are available. The Phaser layer is **not** unit-tested (kept out to avoid canvas/WebGL in unit runs) — it is covered by e2e.

### Content lint — `npm run content:lint`

Every item/card has `sourceIds`; every high/critical item has `safetyNotice`; every workaround has `constraints`/`risks`/`rejectWhen`; nothing is `expert_verified` without metadata; no forbidden dangerous-DIY patterns. Exit 1 on any error.

### Golden tests — `npm run test:golden`

Snapshot stable Level 1 outputs: required red flags, suggested audit checklist, best-possible score, recommended-choice score deltas, and the final summary for a recommended playthrough. Update intentionally with `vitest -u` and review the diff.

### E2E — `npm run test:e2e`

Playwright drives the real app: app loads, start game, complete Level 1 (decide all scenarios, review red flags, generate audit, finish), scorecard appears, progress persists across reload, and there are no console errors. **Requires browsers:** run `npx playwright install` once. Intentionally **excluded from the first CI** (see `docs/`-referenced ADRs and the CI workflow) to keep CI fast and reliable; enable later with cached browsers.

### Build smoke — `npm run build`

Production Vite build must succeed. The Phaser bundle (~344 kB gzipped) trips the default chunk-size warning; this is expected and accepted (single dependency, static deploy) and noted in the dependency policy.

### Security audit — `npm audit --audit-level=high`

No unjustified high/critical vulnerabilities. Currently **0 vulnerabilities**.

## Local pre-push sequence

```bash
npm run format:check && npm run lint && npm run typecheck \
  && npm run test && npm run content:lint && npm run build \
  && npm audit --audit-level=high && bash scripts/check-secrets.sh
```

## Coverage gaps / future work

- Add e2e coverage for the "reset progress" and "switch answer" paths.
- Add tests for `GameController` orchestration (currently exercised indirectly via e2e).
- Add accessibility checks for the overlay UI.
