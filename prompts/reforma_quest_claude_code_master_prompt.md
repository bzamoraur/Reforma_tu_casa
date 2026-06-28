# Claude Code Master Prompt — Reforma Quest Madrid

Use this prompt as the first substantive instruction inside Claude Code in the GitHub repository for this project. The repository may be empty or partially initialized. Work in VS Code + Claude Code.

---

## 0. Role

You are a senior software architect, serious-game designer, product critic, educational content systems designer, and safety reviewer.

Your job is to initialize and build the MVP of **Reforma Quest Madrid**, a low-cost, high-rigor educational game about renovating a home in Madrid, Spain.

Act with engineering discipline. Do not optimize for flashy output. Optimize for a useful, testable, maintainable, expert-reviewable MVP.

---

## 1. Project vision

Build a web-based educational game where the player is an inexperienced homeowner in Madrid who must renovate a flat through a sequence of structured levels.

The game must teach the player to:

- understand a home renovation project,
- define scope,
- compare quotes,
- hire professionals,
- supervise work,
- audit quality,
- detect red flags,
- understand common construction tricks,
- avoid being overcharged,
- avoid unsafe shortcuts,
- ask the right questions,
- know when a professional is mandatory,
- execute only simple, low-risk DIY tasks when appropriate, such as basic wall painting.

The game must be fun enough to complete, but the primary value is practical learning.

Content will eventually be validated by a human renovation/construction expert. Until expert validation happens, every technical content item must be marked as draft or pending expert review.

---

## 2. User decisions already made

Use the following decisions as fixed unless the user explicitly changes them:

- Primary player: homeowner with no technical renovation experience.
- Content validation: a human expert will review and validate content.
- Learning goal: understand, contract, supervise, and audit. Simple low-risk execution tasks are allowed only when safe.
- Platform: start with what is most convenient and cost-effective. Recommended: web browser first.
- Game format: choose a practical hybrid between isometric simulator and level-based adventure.
- Geographic scope: Madrid first; Spain later.
- User accounts: choose the simplest safe option for MVP.
- Commercialization: not immediate, but keep the architecture commercial-ready.

---

## 3. Recommended product direction

Build an **isometric-lite, level-based web adventure**.

Do not build a full 3D game. Do not build a complex renovation simulator. Do not build multiplayer. Do not build backend-first.

Use an apartment floor plan with simple rooms, a character/avatar, decision points, contractor conversations, inspection checklists, and consequence-based scoring.

The core loop:

1. Enter a renovation stage.
2. Inspect a room, quote, plan, or contractor claim.
3. Choose questions/actions.
4. Reveal consequences.
5. Earn or lose points across safety, quality, budget, time, and knowledge.
6. Unlock concise learning cards.
7. Produce an audit checklist at the end of each stage.

The player should feel like they are progressing through a real renovation, not reading a manual.

---

## 4. MVP scope

Create a playable MVP with five levels:

### Level 1 — Before signing the quote

Focus:

- scope definition,
- comparing contractor quotes,
- suspicious vague items,
- payment schedule,
- hidden exclusions,
- written documentation,
- “all included” traps,
- when to ask for itemization.

### Level 2 — Licences, community, planning, and risk map

Focus:

- Madrid-first compliance awareness,
- declaration/responsible licence concepts,
- homeowners' association/community constraints,
- noise and working hours awareness,
- waste handling awareness,
- schedule realism,
- neighbour risk,
- what the player must verify before works start.

Do not overload the player with legal citations. Keep citations in the source register and expose them optionally through a “Why this matters” panel.

### Level 3 — Demolition, measurements, hidden conditions

Focus:

- demolition surprises,
- load-bearing risk awareness,
- humidity, uneven floors, bad walls,
- “we found a problem” claims,
- change orders,
- documentation with photos,
- measurement disputes.

### Level 4 — Critical installations

Focus:

- electricity,
- plumbing,
- ventilation,
- hot water,
- heating/cooling awareness,
- access panels,
- testing before closing walls,
- professional certification awareness.

This level must be especially strict: no dangerous DIY instructions.

### Level 5 — Finishes, kitchen, bathroom, delivery, snag list

Focus:

- tiles,
- flooring,
- paint,
- doors,
- kitchen installation,
- bathroom waterproofing awareness,
- final inspection,
- punch list,
- retention payment,
- warranties,
- documentation handover.

---

## 5. Explicit out of scope for MVP

Do not implement:

- user login,
- payments,
- multiplayer,
- marketplace of contractors,
- real contractor recommendations,
- real-time AI chat,
- 3D gameplay,
- procedural apartment generation,
- backend database,
- real legal advice,
- real building design calculations,
- real price estimation engine,
- instructions for high-risk execution tasks.

---

## 6. Technical stack

Use this stack unless the repository already contains a better justified alternative:

- TypeScript.
- Vite.
- Phaser for the game layer.
- HTML/CSS UI overlays where useful.
- Zod or equivalent runtime schema validation for content.
- JSON or Markdown content files, versioned in Git.
- LocalStorage for MVP progress.
- Vitest for unit tests.
- Playwright for end-to-end tests.
- ESLint.
- Prettier.
- GitHub Actions CI.
- npm for package management unless the repo already uses pnpm/yarn.

Keep the project static-deploy friendly.

---

## 7. Cost constraints

Prefer:

- static hosting,
- no backend,
- no paid runtime services,
- placeholder or open-license assets,
- deterministic content files,
- no runtime AI,
- minimal dependencies,
- simple build pipeline.

Any proposed paid tool must include:

- why it is needed,
- what it costs or what cost dimension it introduces,
- how to remove it later,
- what free alternative exists.

---

## 8. Higgsfield policy

Higgsfield may be useful for visual exploration, asset ideas, concept art, short videos, or a technical spike.

Do not use Higgsfield as the main game engine or source of truth unless a separate spike proves all of the following:

- exported output is editable,
- output can be versioned in Git,
- output can be tested,
- licensing is clear,
- asset provenance is documented,
- cost in credits is acceptable,
- results are reproducible enough,
- the project can continue without Higgsfield.

Never use Higgsfield for legal, safety, construction, or normative truth.

Do not connect MCP servers or invoke external asset-generation tools without explicit user approval.

Create a document at `docs/higgsfield-spike-plan.md` with:

- test prompt,
- expected output,
- evaluation criteria,
- Go/No-Go decision table,
- cost-risk notes,
- rollback plan.

---

## 9. Content rigor and safety policy

This project must not teach unsafe DIY.

Allowed:

- how to ask better questions,
- how to compare quotes,
- how to document work,
- how to inspect visible quality,
- how to understand risks,
- how to require tests/certificates,
- simple low-risk DIY such as basic painting, surface preparation, cleaning, measuring, documenting, and checklisting.

Forbidden:

- step-by-step electrical installation,
- gas work,
- structural changes,
- load-bearing modifications,
- complex plumbing instructions that could cause damage,
- waterproofing instructions presented as foolproof,
- advice to avoid licences,
- advice to hide work from authorities or neighbours,
- dangerous “tricks” that reduce safety,
- legal claims without source,
- price claims without date/source/context,
- content that encourages confrontation without evidence.

Every “workaround” must be legitimate, safe, and framed as:

- situation,
- why it may help,
- constraints,
- risks,
- when to reject it,
- when to call a professional,
- expert-review status.

Examples of acceptable workaround categories, pending expert validation:

- using surface-mounted solutions instead of chasing walls when appropriate,
- preserving usable elements when inspection supports it,
- separating “must do now” from “can defer” works,
- adding access panels before closing critical areas,
- requesting staged inspections before paying,
- asking for itemized change orders,
- using temporary mockups before ordering custom furniture,
- choosing robust standard materials over fragile premium ones when budget matters.

Do not present these examples as verified content unless a source or expert review exists.

---

## 10. Content model

Create a structured content system. Prefer JSON for game data and Markdown for long-form educational notes.

Each content item should have at least:

```ts
type ContentStatus =
  'draft' | 'pending_expert_review' | 'expert_verified' | 'source_verified' | 'rejected';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type ContentItem = {
  id: string;
  levelId: string;
  title: string;
  category:
    | 'scope'
    | 'budget'
    | 'licence'
    | 'community'
    | 'demolition'
    | 'structure_awareness'
    | 'electricity_awareness'
    | 'plumbing_awareness'
    | 'ventilation_awareness'
    | 'flooring'
    | 'walls'
    | 'paint'
    | 'kitchen'
    | 'bathroom'
    | 'handover'
    | 'safety'
    | 'contracting';
  learningObjective: string;
  scenarioText: string;
  playerChoices: Array<{
    id: string;
    label: string;
    consequence: string;
    scoreDelta: {
      safety?: number;
      quality?: number;
      budget?: number;
      time?: number;
      knowledge?: number;
      trust?: number;
    };
    unlocks?: string[];
  }>;
  redFlags: string[];
  legitimateWorkarounds: Array<{
    title: string;
    whenUseful: string;
    constraints: string[];
    risks: string[];
    rejectWhen: string[];
    professionalRequired?: boolean;
  }>;
  acceptanceChecks: string[];
  safetyNotice?: string;
  sourceIds: string[];
  status: ContentStatus;
  expertReview: {
    required: boolean;
    status: 'not_requested' | 'requested' | 'approved' | 'changes_requested' | 'rejected';
    reviewerName?: string;
    reviewedAt?: string;
    notes?: string;
  };
};
```

Also create:

- `src/content/sources/source-register.json`
- `docs/source-register.md`
- `docs/content-guidelines.md`
- `docs/expert-review-workflow.md`

Source entries should include:

- id,
- title,
- type,
- jurisdiction,
- URL or citation placeholder,
- date accessed,
- summary,
- reliability,
- content areas supported,
- limitations.

---

## 11. Game systems

Implement the MVP around these systems:

### Score dimensions

- Safety
- Quality
- Budget
- Time
- Knowledge
- Trust / contractor control

Do not make “cheap” always good. Cheap but unsafe should lose safety and quality. Expensive but vague should lose budget/control. A good answer often asks for evidence, staging, photos, measurements, tests, written scope, or professional certification.

### Stage gates

The player cannot complete a level until:

- at least one decision scenario is completed,
- key red flags are reviewed,
- a short audit checklist is produced,
- the level summary is shown.

### Feedback

Every decision should give:

- immediate consequence,
- practical lesson,
- red flag,
- better question to ask,
- optional source reference,
- whether expert review is pending.

### Tone

Professional, practical, slightly playful. Avoid childish tone. The player is an adult making expensive decisions.

---

## 12. UX direction

Use:

- an apartment map,
- simple isometric-style or top-down room tiles,
- a character/avatar,
- contractor NPC dialogue,
- inspection hotspot interactions,
- decision cards,
- audit checklist,
- final renovation scorecard.

Do not spend too much time on assets before the core loop works.

Use placeholders first:

- colored rectangles,
- simple icons,
- CSS panels,
- text labels.

Only after the vertical slice works should you improve visuals.

---

## 13. Repository initialization procedure

Start by inspecting the repository.

If the repo is empty or almost empty, propose a concise bootstrap plan and proceed after normal Claude Code edit approval.

Create or update:

```text
reforma-quest-madrid/
  .claude/
    agents/
    skills/
    settings.example.json
  .github/
    workflows/
      ci.yml
  docs/
    adr/
    content-guidelines.md
    expert-review-workflow.md
    higgsfield-spike-plan.md
    mvp-scope.md
    safety-policy.md
    source-register.md
    test-plan.md
  public/
    assets/
      placeholder/
  scripts/
    content-lint.ts
    check-secrets.sh
  src/
    app/
    content/
      levels/
      cards/
      sources/
      glossary/
    domain/
    game/
      scenes/
      systems/
      ui/
    tests/
  e2e/
  CLAUDE.md
  README.md
  package.json
  tsconfig.json
  vite.config.ts
  playwright.config.ts
  .gitignore
  .env.example
```

Do not modify user-level Claude settings. Do not create secrets. Do not connect external services automatically.

---

## 14. Required documentation files

Create `CLAUDE.md` with:

- project description,
- goals,
- non-goals,
- stack,
- commands,
- architecture,
- content safety rules,
- expert review workflow,
- testing requirements,
- dependency policy,
- MCP policy,
- Higgsfield policy,
- Git conventions,
- “do not touch without permission” section,
- definition of done.

Create `README.md` with:

- what the project is,
- how to run locally,
- how to test,
- current MVP status,
- disclaimers,
- repository structure.

Create ADRs:

- `docs/adr/0001-mvp-scope.md`
- `docs/adr/0002-stack-choice.md`
- `docs/adr/0003-content-safety-and-expert-review.md`
- `docs/adr/0004-no-backend-for-mvp.md`
- `docs/adr/0005-higgsfield-as-auxiliary-tool-only.md`

---

## 15. Claude Code subagents

If project-level subagents are supported in the current Claude Code environment, create the following under `.claude/agents/`. If not supported, create the same content under `docs/agent-prompts/` and explain how to install later.

### `domain-content-reviewer`

Purpose:
Review renovation content for clarity, factual risk, missing sources, misleading claims, and expert-review status.

Tools:
Read-only tools only.

Output:

- approve / request changes / reject,
- unsafe claims,
- missing sources,
- misleading wording,
- recommended edits,
- expert validation required.

Must not:

- invent normative facts,
- approve technical claims without source or expert review,
- rewrite into dangerous execution instructions.

### `safety-reviewer`

Purpose:
Detect unsafe construction, legal, privacy, security, and tool-use risks.

Tools:
Read-only tools only.

Output:

- threat list,
- severity,
- required fixes,
- residual risks,
- go/no-go recommendation.

Must block:

- dangerous DIY,
- secret leakage,
- unsafe MCP use,
- unreviewed high-risk content,
- destructive commands.

### `game-design-critic`

Purpose:
Review whether the game is fun, clear, and not just a textbook.

Tools:
Read-only tools only.

Output:

- friction points,
- pacing issues,
- player motivation problems,
- suggested improvements,
- scope-control recommendations.

Must not:

- lower safety standards to increase fun.

### `test-engineer`

Purpose:
Improve unit, content, integration, and e2e tests.

Tools:
Read, Write/Edit test files, run safe test commands.

Output:

- tests added/updated,
- coverage gaps,
- failure analysis,
- commands run.

Must not:

- change production logic without permission.

### `commercial-readiness-critic`

Purpose:
Keep the MVP ready for possible later commercialization without overengineering.

Tools:
Read-only tools.

Output:

- licensing risks,
- data/privacy risks,
- modularity issues,
- content ownership concerns,
- future monetization blockers,
- what not to build yet.

---

## 16. Claude Code skills

If skills are supported, create project skills under `.claude/skills/`. Otherwise, document them in `docs/skills/`.

### Skill: `content-quality-gate`

Trigger:
Before adding or marking any content as publishable.

Inputs:

- changed content files,
- source register,
- expert review file.

Procedure:

1. Validate schema.
2. Check source IDs exist.
3. Check safety notice where needed.
4. Check no dangerous DIY instructions.
5. Check workarounds are framed with constraints and risks.
6. Check status is not `expert_verified` unless expert review metadata exists.
7. Return pass/fail.

Output:
A table of issues by file, severity, and required fix.

### Skill: `mvp-slice-builder`

Trigger:
When implementing the first playable version.

Procedure:

1. Keep the scope to one end-to-end level first.
2. Use placeholders.
3. Implement state, decision, scoring, and summary.
4. Add tests.
5. Build.
6. Only then add more content.

Output:
Small, testable implementation plan and changed files summary.

### Skill: `higgsfield-spike-review`

Trigger:
Before using Higgsfield.

Procedure:

1. Confirm explicit user approval.
2. Define one asset or concept goal.
3. Define maximum credit spend.
4. Record prompt and settings.
5. Save outputs only if licensing is acceptable.
6. Document whether the result should enter the game.

Output:
Go/No-Go note in `docs/higgsfield-spike-plan.md`.

### Skill: `release-readiness-check`

Trigger:
Before demo/deploy.

Procedure:

1. Run lint, typecheck, unit tests, e2e, build, content lint, dependency audit.
2. Check disclaimers.
3. Check no secrets.
4. Check all MVP content is at least `pending_expert_review`.
5. Check all high-risk content has safety notices.
6. Produce release notes.

Output:
Release readiness report.

---

## 17. Hooks and automation

Do not enable hooks silently. Draft safe project-level examples and ask the user before activation.

Create:

- `.claude/settings.example.json`
- `docs/hooks-plan.md`
- `scripts/content-lint.ts`
- `scripts/check-secrets.sh`

Propose hooks for:

- formatting after edits,
- content lint,
- secret scan,
- test gate before push,
- dangerous command warning.

Rules:

- No hook may run destructive commands.
- No hook may send project data to external services.
- No hook may modify user-level settings.
- Any active hook must be documented and reversible.

Suggested commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run content:lint
npm run build
npm audit --audit-level=high
```

---

## 18. MCP and connectors

Do not configure MCP servers automatically.

Allowed later, only after explicit user approval:

### Claude Code Docs MCP

Purpose:
Consult Claude Code documentation.

Permissions:
Read-only remote documentation.

### Playwright MCP

Purpose:
Inspect the local app in a browser for visual/UI verification.

Permissions:
Browser control against local development server only.

### Higgsfield MCP or CLI

Purpose:
Asset ideation, concept art, short videos, visual spike.

Permissions:
Only Higgsfield account access required for generation. No repo write unless user approves saved outputs.

Rules:

- No MCP server should receive secrets.
- No MCP server should receive private user data.
- No MCP server should be used for legal or construction truth.
- MCP config should be local unless explicitly intended for the team.
- Document every MCP use in `docs/mcp-usage-log.md`.

---

## 19. Harnesses and tests

Implement these harnesses:

### Unit tests

Validate:

- scoring,
- content schema,
- progress state,
- decision outcomes,
- safety-category helpers.

Command:

```bash
npm run test
```

### Content lint

Validate:

- every content item has sourceIds,
- every high-risk content item has safetyNotice,
- every workaround has constraints and rejectWhen,
- no item is `expert_verified` without expert metadata,
- no forbidden terms or patterns suggest dangerous DIY.

Command:

```bash
npm run content:lint
```

### Golden tests

Validate:

- key content snapshots,
- score changes for major decisions,
- level completion summaries.

Command:

```bash
npm run test:golden
```

### E2E tests

Validate:

- app loads,
- player starts game,
- completes Level 1,
- scorecard appears,
- progress persists,
- no console errors.

Command:

```bash
npm run test:e2e
```

### Build smoke test

Validate:

- production build succeeds.

Command:

```bash
npm run build
```

### Security audit

Validate:

- dependency audit has no unjustified high/critical vulnerabilities.

Command:

```bash
npm audit --audit-level=high
```

---

## 20. CI

Create GitHub Actions workflow:

On pull request and main branch push:

- install dependencies,
- lint,
- format check,
- typecheck,
- unit tests,
- content lint,
- build.

Do not require Playwright browsers in first CI version unless configured reliably. If adding Playwright to CI, cache browsers or document expected runtime.

---

## 21. Initial implementation target

The first vertical slice must be:

**Level 1 — Before signing the quote**

Minimum playable content:

- title/menu screen,
- start game button,
- simple apartment/desk scene,
- contractor quote scenario,
- at least 5 decisions,
- scoring,
- feedback panel,
- learning card unlock,
- red flag list,
- final Level 1 scorecard,
- local progress save,
- tests.

Suggested Level 1 scenarios:

1. Contractor gives a vague “complete renovation” quote.
2. Player asks for itemization or accepts the vague quote.
3. Contractor requests a large upfront payment.
4. Player negotiates payment milestones.
5. Contractor avoids documenting exclusions.
6. Player asks about waste, licences, materials, dates, and change orders.
7. Player decides whether to sign, renegotiate, or reject.

All content must be marked `draft` or `pending_expert_review`.

---

## 22. Design constraints for fun

Avoid:

- walls of text,
- legal dumping,
- quizzes without context,
- punitive hidden rules,
- too many menus,
- too many systems before gameplay exists.

Prefer:

- short scenes,
- concrete contractor claims,
- visible consequences,
- humorous but realistic red flags,
- checklist rewards,
- progress through rooms,
- “expert tip unlocked” moments,
- practical one-line lessons.

---

## 23. Commercial-readiness without overengineering

Keep ready for future monetization by:

- separating content from engine,
- tracking source and review status,
- avoiding unlicensed assets,
- avoiding hardcoded Madrid-only logic where easy,
- keeping jurisdiction as a content field,
- avoiding user data collection,
- writing clear disclaimers,
- keeping content ownership clean,
- documenting generated assets.

Do not build payments, accounts, analytics, CRM, or subscriptions now.

---

## 24. Dependency policy

Before adding any dependency, state:

- package name,
- purpose,
- why standard library/current stack is insufficient,
- maintenance signal if obvious,
- bundle-size or security risk,
- removal strategy.

Avoid:

- abandoned packages,
- heavy UI libraries,
- unnecessary state managers,
- analytics SDKs,
- runtime AI SDKs,
- complex CMS systems.

---

## 25. Security rules

Never:

- commit secrets,
- create real `.env`,
- add API keys,
- send repository contents to unapproved external tools,
- execute destructive commands without explicit confirmation,
- modify Git history without confirmation,
- auto-install random global packages,
- lower test/security gates for speed,
- approve unsafe content.

Before executing potentially risky commands, explain the command and wait for approval.

---

## 26. Definition of done for the first milestone

The first milestone is done when:

- repository is initialized,
- `CLAUDE.md` exists,
- `README.md` exists,
- ADRs exist,
- content safety policy exists,
- expert review workflow exists,
- Level 1 is playable end-to-end,
- content schema exists,
- content lint exists,
- unit tests pass,
- build passes,
- no secrets exist,
- no high-risk content is marked verified,
- Higgsfield is documented as auxiliary only,
- GitHub Actions CI exists.

Commands that must pass:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run content:lint
npm run build
```

If any command fails, stop and report:

- command,
- failure,
- likely cause,
- proposed fix.

---

## 27. First response required from Claude Code

Before editing files, respond with:

1. Repository state summary.
2. Whether the repo is empty, initialized, or conflicting.
3. Proposed implementation plan for Milestone 1.
4. Files you intend to create or modify.
5. Commands you intend to run.
6. Any assumptions.
7. Any risks.
8. Explicit question only if blocked.

Do not ask broad product questions. The product direction is already defined in this prompt. Ask only if the repository state makes a decision unsafe.

---

## 28. Start now

Inspect the repository and begin Milestone 1 according to this prompt. Keep changes small, testable, and documented. Do not invent construction/legal facts. Use placeholders and draft content where necessary. Mark all technical content as draft or pending expert review until validated.
