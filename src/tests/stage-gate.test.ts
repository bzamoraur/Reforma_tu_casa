import { describe, expect, it } from 'vitest';
import { createEmptyLevelProgress } from '../domain/progress';
import {
  allItemsDecided,
  allRedFlagsReviewed,
  applyChoice,
  canCompleteLevel,
  recordAuditChecklist,
  requiredRedFlags,
  reviewRedFlag,
  suggestedAuditChecklist,
} from '../domain/stage-gate';
import type { ContentItem, LevelPack } from '../domain/types';

function makeItem(id: string, partial: Partial<ContentItem> = {}): ContentItem {
  return {
    id,
    levelId: 'test',
    title: id,
    category: 'contracting',
    riskLevel: 'low',
    learningObjective: 'x',
    scenarioText: 'x',
    playerChoices: [
      { id: 'a', label: 'a', consequence: 'c', scoreDelta: { knowledge: 2 } },
      { id: 'b', label: 'b', consequence: 'c', scoreDelta: { knowledge: -1 } },
    ],
    redFlags: [`flag-${id}`],
    legitimateWorkarounds: [],
    acceptanceChecks: [`check-${id}`],
    sourceIds: ['s1'],
    status: 'draft',
    expertReview: { required: true, status: 'not_requested' },
    ...partial,
  };
}

const pack: LevelPack = {
  level: { id: 'test', order: 1, title: 't', intro: 'i', available: true },
  items: [makeItem('i1'), makeItem('i2')],
  cards: [],
};

describe('requiredRedFlags / suggestedAuditChecklist', () => {
  it('collects deduplicated red flags and acceptance checks', () => {
    expect(requiredRedFlags(pack)).toEqual(['flag-i1', 'flag-i2']);
    expect(suggestedAuditChecklist(pack)).toEqual(['check-i1', 'check-i2']);
  });
});

describe('applyChoice', () => {
  it('records a choice and applies its score delta', () => {
    const lp = createEmptyLevelProgress('test');
    const { progress, changed } = applyChoice(pack, lp, 'i1', 'a');
    expect(changed).toBe(true);
    expect(progress.choices['i1']).toBe('a');
    expect(progress.score.knowledge).toBe(2);
  });

  it('is idempotent for the same choice', () => {
    const lp = createEmptyLevelProgress('test');
    const first = applyChoice(pack, lp, 'i1', 'a').progress;
    const second = applyChoice(pack, first, 'i1', 'a');
    expect(second.changed).toBe(false);
    expect(second.progress.score.knowledge).toBe(2);
  });

  it('recomputes score cleanly when switching answers (no drift)', () => {
    const lp = createEmptyLevelProgress('test');
    const afterA = applyChoice(pack, lp, 'i1', 'a').progress;
    expect(afterA.score.knowledge).toBe(2);
    const afterB = applyChoice(pack, afterA, 'i1', 'b').progress;
    expect(afterB.score.knowledge).toBe(-1);
  });

  it('ignores unknown items or choices', () => {
    const lp = createEmptyLevelProgress('test');
    expect(applyChoice(pack, lp, 'nope', 'a').changed).toBe(false);
    expect(applyChoice(pack, lp, 'i1', 'nope').changed).toBe(false);
  });
});

describe('stage gate', () => {
  it('blocks completion until all requirements are met, then allows it', () => {
    let lp = createEmptyLevelProgress('test');
    expect(canCompleteLevel(pack, lp).ok).toBe(false);

    lp = applyChoice(pack, lp, 'i1', 'a').progress;
    lp = applyChoice(pack, lp, 'i2', 'a').progress;
    expect(allItemsDecided(pack, lp)).toBe(true);
    expect(canCompleteLevel(pack, lp).ok).toBe(false); // red flags + audit missing

    lp = reviewRedFlag(lp, 'flag-i1');
    lp = reviewRedFlag(lp, 'flag-i2');
    expect(allRedFlagsReviewed(pack, lp)).toBe(true);
    expect(canCompleteLevel(pack, lp).ok).toBe(false); // audit still missing

    lp = recordAuditChecklist(lp, suggestedAuditChecklist(pack));
    const gate = canCompleteLevel(pack, lp);
    expect(gate.ok).toBe(true);
    expect(gate.missing).toEqual([]);
  });

  it('reports what is missing', () => {
    const lp = createEmptyLevelProgress('test');
    const gate = canCompleteLevel(pack, lp);
    expect(gate.missing.length).toBe(3);
  });

  it('reviewRedFlag is idempotent', () => {
    let lp = createEmptyLevelProgress('test');
    lp = reviewRedFlag(lp, 'flag-i1');
    lp = reviewRedFlag(lp, 'flag-i1');
    expect(lp.reviewedRedFlags).toEqual(['flag-i1']);
  });
});
