/**
 * Stage-gate rules (master prompt §11). A level cannot be completed until:
 *   - every decision scenario has been decided,
 *   - the key red flags have been reviewed,
 *   - a short audit checklist has been produced,
 * after which the level summary is shown.
 *
 * Pure functions operating on (LevelPack, LevelProgress). No persistence here.
 */

import { applyScoreDelta, findChoice } from './scoring';
import { createEmptyLevelProgress, type LevelProgress } from './progress';
import type { LevelPack } from './types';

/** The deduplicated set of red flags a player must review to finish a level. */
export function requiredRedFlags(pack: LevelPack): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of pack.items) {
    for (const flag of item.redFlags) {
      if (!seen.has(flag)) {
        seen.add(flag);
        out.push(flag);
      }
    }
  }
  return out;
}

/**
 * The suggested audit checklist for a level, compiled from every item's
 * acceptanceChecks (deduplicated). This is what the player "produces" at the
 * end of the stage; recording it satisfies the audit-checklist gate.
 */
export function suggestedAuditChecklist(pack: LevelPack): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of pack.items) {
    for (const check of item.acceptanceChecks) {
      if (!seen.has(check)) {
        seen.add(check);
        out.push(check);
      }
    }
  }
  return out;
}

export function allItemsDecided(pack: LevelPack, progress: LevelProgress): boolean {
  return pack.items.every((item) => typeof progress.choices[item.id] === 'string');
}

export function allRedFlagsReviewed(pack: LevelPack, progress: LevelProgress): boolean {
  const reviewed = new Set(progress.reviewedRedFlags);
  return requiredRedFlags(pack).every((flag) => reviewed.has(flag));
}

export type GateMissingCode = 'scenarios' | 'redflags' | 'checklist';

/**
 * A pending completion requirement, expressed as a stable code + count so the
 * domain stays presentation-agnostic. The UI maps codes to player-facing text
 * (see src/game/ui/labels.ts).
 */
export interface GateMissing {
  code: GateMissingCode;
  count: number;
}

export interface GateResult {
  ok: boolean;
  missing: GateMissing[];
}

/** Evaluate whether the player may complete the level, and what is missing. */
export function canCompleteLevel(pack: LevelPack, progress: LevelProgress): GateResult {
  const missing: GateMissing[] = [];
  if (!allItemsDecided(pack, progress)) {
    const undecided = pack.items.filter((i) => !progress.choices[i.id]).length;
    missing.push({ code: 'scenarios', count: undecided });
  }
  if (!allRedFlagsReviewed(pack, progress)) {
    const reviewed = new Set(progress.reviewedRedFlags);
    const remaining = requiredRedFlags(pack).filter((f) => !reviewed.has(f)).length;
    missing.push({ code: 'redflags', count: remaining });
  }
  if (progress.auditChecklist.length === 0) {
    missing.push({ code: 'checklist', count: 1 });
  }
  return { ok: missing.length === 0, missing };
}

export interface ChoiceApplication {
  progress: LevelProgress;
  /** Card/content ids newly unlocked by this choice. */
  unlocked: string[];
  /** Whether this was a new decision (false if the item was already decided). */
  changed: boolean;
}

/**
 * Record a player's choice for an item: store it, apply its score delta, and
 * return any unlocks. Idempotent on the choice id — re-choosing the same option
 * does not re-apply the delta. Choosing a different option recomputes the level
 * score from scratch so the score never drifts.
 */
export function applyChoice(
  pack: LevelPack,
  progress: LevelProgress,
  itemId: string,
  choiceId: string,
): ChoiceApplication {
  const item = pack.items.find((i) => i.id === itemId);
  if (!item) {
    return { progress, unlocked: [], changed: false };
  }
  const choice = findChoice(item, choiceId);
  if (!choice) {
    return { progress, unlocked: [], changed: false };
  }
  if (progress.choices[itemId] === choiceId) {
    return { progress, unlocked: choice.unlocks ?? [], changed: false };
  }

  const nextChoices = { ...progress.choices, [itemId]: choiceId };

  // Recompute the whole level score from the recorded choices so switching an
  // answer cannot leave stale points behind.
  let score = createEmptyLevelProgress(progress.levelId).score;
  for (const [decidedItemId, decidedChoiceId] of Object.entries(nextChoices)) {
    const decidedItem = pack.items.find((i) => i.id === decidedItemId);
    const decidedChoice = decidedItem && findChoice(decidedItem, decidedChoiceId);
    if (decidedChoice) {
      score = applyScoreDelta(score, decidedChoice.scoreDelta);
    }
  }

  return {
    progress: { ...progress, choices: nextChoices, score },
    unlocked: choice.unlocks ?? [],
    changed: true,
  };
}

/** Mark a red flag as reviewed (idempotent). */
export function reviewRedFlag(progress: LevelProgress, flag: string): LevelProgress {
  if (progress.reviewedRedFlags.includes(flag)) return progress;
  return { ...progress, reviewedRedFlags: [...progress.reviewedRedFlags, flag] };
}

/** Attach the produced audit checklist to the level progress. */
export function recordAuditChecklist(progress: LevelProgress, checklist: string[]): LevelProgress {
  return { ...progress, auditChecklist: [...checklist] };
}
