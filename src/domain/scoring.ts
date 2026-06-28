/**
 * Scoring engine. Pure functions, no side effects, fully unit-testable.
 *
 * Design principle (from the master prompt §11): "cheap" is not always good.
 * Cheap-but-unsafe loses safety/quality; expensive-but-vague loses budget/trust.
 * Strong answers ask for evidence, staging, photos, tests, written scope, or
 * professional certification. The scoreDelta values live in the content data,
 * so this engine stays neutral — it only aggregates and rates.
 */

import {
  SCORE_DIMENSIONS,
  type ContentItem,
  type DimensionRating,
  type LevelPack,
  type PlayerChoice,
  type ScoreDelta,
  type ScoreDimension,
  type ScoreState,
} from './types';

/** A fresh, zeroed score vector. */
export function createInitialScore(): ScoreState {
  return { safety: 0, quality: 0, budget: 0, time: 0, knowledge: 0, trust: 0 };
}

/** Immutably apply a (partial) delta to a score vector. */
export function applyScoreDelta(state: ScoreState, delta: ScoreDelta): ScoreState {
  const next: ScoreState = { ...state };
  for (const dim of SCORE_DIMENSIONS) {
    const d = delta[dim];
    if (typeof d === 'number') {
      next[dim] += d;
    }
  }
  return next;
}

/** Look up a choice within an item by id. Returns undefined if not found. */
export function findChoice(item: ContentItem, choiceId: string): PlayerChoice | undefined {
  return item.playerChoices.find((c) => c.id === choiceId);
}

/**
 * Best achievable score for a level: for each item and each dimension, take the
 * most favourable delta available across that item's choices (clamped at >= 0),
 * then sum. Used to normalize ratings so they are meaningful per level.
 */
export function bestPossibleScore(pack: LevelPack): ScoreState {
  const best = createInitialScore();
  for (const item of pack.items) {
    for (const dim of SCORE_DIMENSIONS) {
      const maxForItem = Math.max(0, ...item.playerChoices.map((c) => c.scoreDelta[dim] ?? 0));
      best[dim] += maxForItem;
    }
  }
  return best;
}

/**
 * Rate a single dimension's value against the best achievable for that level.
 * Ratio thresholds: >=0.85 excellent, >=0.6 good, >=0.3 fair, else poor.
 * When nothing positive is achievable for a dimension, a non-negative score
 * is treated as "good" (the player simply avoided losses).
 */
export function rateDimension(value: number, best: number): DimensionRating {
  if (best <= 0) {
    return value >= 0 ? 'good' : 'poor';
  }
  const ratio = value / best;
  if (ratio >= 0.85) return 'excellent';
  if (ratio >= 0.6) return 'good';
  if (ratio >= 0.3) return 'fair';
  return 'poor';
}

export interface LevelScoreSummary {
  score: ScoreState;
  best: ScoreState;
  ratings: Record<ScoreDimension, DimensionRating>;
  overallRatio: number;
  overallRating: DimensionRating;
}

/** Produce a per-dimension and overall rating for a level's final score. */
export function summarizeScore(score: ScoreState, pack: LevelPack): LevelScoreSummary {
  const best = bestPossibleScore(pack);
  const ratings = {} as Record<ScoreDimension, DimensionRating>;
  let ratioSum = 0;
  let ratioCount = 0;
  for (const dim of SCORE_DIMENSIONS) {
    ratings[dim] = rateDimension(score[dim], best[dim]);
    if (best[dim] > 0) {
      ratioSum += Math.max(0, score[dim]) / best[dim];
      ratioCount += 1;
    }
  }
  const overallRatio = ratioCount > 0 ? ratioSum / ratioCount : 1;
  const overallRating: DimensionRating =
    overallRatio >= 0.85
      ? 'excellent'
      : overallRatio >= 0.6
        ? 'good'
        : overallRatio >= 0.3
          ? 'fair'
          : 'poor';
  return { score, best, ratings, overallRatio, overallRating };
}
