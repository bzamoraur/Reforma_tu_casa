/**
 * Golden tests for Level 3. These snapshot the stable, player-visible outputs
 * (red flags, audit checklist, best-possible score, recommended-choice deltas,
 * and the final summary for a model playthrough) so unintended content or
 * scoring drift is caught in review. Update intentionally with `vitest -u`.
 */

import { describe, expect, it } from 'vitest';
import { bestPossibleScore, summarizeScore } from '../../domain/scoring';
import { createEmptyLevelProgress } from '../../domain/progress';
import { applyChoice, requiredRedFlags, suggestedAuditChecklist } from '../../domain/stage-gate';
import { getLevelPack } from '../../game/systems/content';
import type { LevelPack } from '../../domain/types';

function level3(): LevelPack {
  const pack = getLevelPack('level-3');
  if (!pack) throw new Error('level-3 not found');
  return pack;
}

function playRecommended(pack: LevelPack) {
  let lp = createEmptyLevelProgress(pack.level.id);
  for (const item of pack.items) {
    const recommended = item.playerChoices.find((c) => c.recommended) ?? item.playerChoices[0];
    lp = applyChoice(pack, lp, item.id, recommended.id).progress;
  }
  return lp;
}

describe('Level 3 — golden', () => {
  it('is available and has at least five decisions', () => {
    const pack = level3();
    expect(pack.level.available).toBe(true);
    expect(pack.items.length).toBeGreaterThanOrEqual(5);
  });

  it('every high-risk or dangerous-category item carries a safetyNotice', () => {
    const dangerous = new Set([
      'demolition',
      'structure_awareness',
      'electricity_awareness',
      'plumbing_awareness',
      'ventilation_awareness',
    ]);
    for (const item of level3().items) {
      if (
        item.riskLevel === 'high' ||
        item.riskLevel === 'critical' ||
        dangerous.has(item.category)
      ) {
        expect(item.safetyNotice, `${item.id} needs a safetyNotice`).toBeTruthy();
      }
    }
  });

  it('required red flags', () => {
    expect(requiredRedFlags(level3())).toMatchSnapshot();
  });

  it('suggested audit checklist', () => {
    expect(suggestedAuditChecklist(level3())).toMatchSnapshot();
  });

  it('best possible score', () => {
    expect(bestPossibleScore(level3())).toMatchSnapshot();
  });

  it('recommended-choice score deltas per item', () => {
    const pack = level3();
    const deltas = pack.items.map((item) => {
      const rec = item.playerChoices.find((c) => c.recommended);
      return { item: item.id, choice: rec?.id ?? null, scoreDelta: rec?.scoreDelta ?? null };
    });
    expect(deltas).toMatchSnapshot();
  });

  it('final score and summary for a recommended playthrough', () => {
    const pack = level3();
    const lp = playRecommended(pack);
    const summary = summarizeScore(lp.score, pack);
    expect({
      score: lp.score,
      ratings: summary.ratings,
      overallRating: summary.overallRating,
    }).toMatchSnapshot();
  });

  it('every recommended playthrough produces a non-negative overall ratio', () => {
    const pack = level3();
    const lp = playRecommended(pack);
    const summary = summarizeScore(lp.score, pack);
    expect(summary.overallRatio).toBeGreaterThan(0.5);
  });
});
