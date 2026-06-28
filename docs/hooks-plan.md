# Hooks plan

Hooks are **not enabled** in this repository. This document proposes safe, reversible project-level hooks for the user to review. A ready-to-copy example lives in `.claude/settings.example.json`. Nothing is activated until the user copies it to `.claude/settings.json` (git-ignored or committed at their discretion) and confirms.

## Rules (non-negotiable)

- No hook may run destructive commands.
- No hook may send project data to external services.
- No hook may modify user-level settings.
- Every active hook must be documented here and be reversible (delete it from `settings.json`).

## Proposed hooks

| Trigger                                  | Action                                                               | Why                          | Risk                     |
| ---------------------------------------- | -------------------------------------------------------------------- | ---------------------------- | ------------------------ |
| After edit (`PostToolUse` on Edit/Write) | `npm run format` on changed files                                    | Consistent formatting        | none (local, reversible) |
| Before commit / on demand                | `npm run content:lint`                                               | Block unsafe/invalid content | none (read-only check)   |
| Before commit / on demand                | `bash scripts/check-secrets.sh`                                      | Prevent secret leakage       | none (read-only check)   |
| Before push (manual gate)                | `npm run lint && npm run typecheck && npm run test && npm run build` | Keep main green              | none (read-only of repo) |
| Dangerous-command warning                | warn on `rm -rf`, `git push --force`, `npm audit fix --force`        | Prevent footguns             | none (advisory)          |

## How to enable

1. Read `.claude/settings.example.json`.
2. Copy the hooks you want into `.claude/settings.json`.
3. Test on a throwaway change.
4. Document the active set here.

## How to disable

Remove the hook entry from `.claude/settings.json`. No other cleanup needed.
