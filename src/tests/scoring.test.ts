import { describe, expect, it } from 'vitest';
import {
  applyScoreDelta,
  bestPossibleScore,
  createInitialScore,
  findChoice,
  rateDimension,
  summarizeScore,
} from '../domain/scoring';
import type { ContentItem, LevelPack } from '../domain/types';

function makeItem(id: string, choices: ContentItem['playerChoices']): ContentItem {
  return {
    id,
    levelId: 'test',
    title: id,
    category: 'contracting',
    riskLevel: 'low',
    learningObjective: 'x',
    scenarioText: 'x',
    playerChoices: choices,
    redFlags: [],
    legitimateWorkarounds: [],
    acceptanceChecks: ['x'],
    sourceIds: ['s1'],
    status: 'draft',
    expertReview: { required: true, status: 'not_requested' },
  };
}

const pack: LevelPack = {
  level: { id: 'test', order: 1, title: 't', intro: 'i', available: true },
  items: [
    makeItem('i1', [
      { id: 'good', label: 'g', consequence: 'c', scoreDelta: { knowledge: 4, budget: 2 } },
      { id: 'bad', label: 'b', consequence: 'c', scoreDelta: { knowledge: -2, budget: -3 } },
    ]),
    makeItem('i2', [
      { id: 'good', label: 'g', consequence: 'c', scoreDelta: { safety: 6 } },
      { id: 'bad', label: 'b', consequence: 'c', scoreDelta: { safety: -1 } },
    ]),
  ],
  cards: [],
};

describe('createInitialScore', () => {
  it('returns all six dimensions zeroed', () => {
    expect(createInitialScore()).toEqual({
      safety: 0,
      quality: 0,
      budget: 0,
      time: 0,
      knowledge: 0,
      trust: 0,
    });
  });
});

describe('applyScoreDelta', () => {
  it('adds partial deltas without mutating the input', () => {
    const base = createInitialScore();
    const next = applyScoreDelta(base, { knowledge: 2, budget: -1 });
    expect(next.knowledge).toBe(2);
    expect(next.budget).toBe(-1);
    expect(next.safety).toBe(0);
    // immutability
    expect(base.knowledge).toBe(0);
    expect(next).not.toBe(base);
  });

  it('accumulates across multiple applications', () => {
    let s = createInitialScore();
    s = applyScoreDelta(s, { trust: 1 });
    s = applyScoreDelta(s, { trust: 2, time: -1 });
    expect(s.trust).toBe(3);
    expect(s.time).toBe(-1);
  });
});

describe('findChoice', () => {
  it('finds a choice by id and returns undefined otherwise', () => {
    expect(findChoice(pack.items[0], 'good')?.label).toBe('g');
    expect(findChoice(pack.items[0], 'nope')).toBeUndefined();
  });
});

describe('bestPossibleScore', () => {
  it('takes the most favourable non-negative delta per dimension per item', () => {
    const best = bestPossibleScore(pack);
    // i1 best: knowledge 4, budget 2; i2 best: safety 6
    expect(best.knowledge).toBe(4);
    expect(best.budget).toBe(2);
    expect(best.safety).toBe(6);
    // negative-only dimensions clamp to 0
    expect(best.time).toBe(0);
  });
});

describe('rateDimension', () => {
  it('rates by ratio thresholds', () => {
    expect(rateDimension(9, 10)).toBe('excellent');
    expect(rateDimension(6, 10)).toBe('good');
    expect(rateDimension(3, 10)).toBe('fair');
    expect(rateDimension(2, 10)).toBe('poor');
  });
  it('treats non-negative as good when nothing positive is achievable', () => {
    expect(rateDimension(0, 0)).toBe('good');
    expect(rateDimension(-1, 0)).toBe('poor');
  });
});

describe('summarizeScore', () => {
  it('produces per-dimension and overall ratings', () => {
    // Perfect play: pick both "good" choices.
    const perfect = applyScoreDelta(
      applyScoreDelta(createInitialScore(), { knowledge: 4, budget: 2 }),
      {
        safety: 6,
      },
    );
    const summary = summarizeScore(perfect, pack);
    expect(summary.ratings.knowledge).toBe('excellent');
    expect(summary.ratings.safety).toBe('excellent');
    expect(summary.overallRating).toBe('excellent');
    expect(summary.overallRatio).toBeCloseTo(1, 5);
  });

  it('penalizes poor play', () => {
    const poor = applyScoreDelta(createInitialScore(), { knowledge: -2, budget: -3, safety: -1 });
    const summary = summarizeScore(poor, pack);
    expect(summary.overallRating).toBe('poor');
  });
});
