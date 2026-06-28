import { describe, expect, it } from 'vitest';
import { contentItemSchema, levelPackSchema } from '../domain/schema';

const validItem = {
  id: 'x',
  levelId: 'level-1',
  title: 'T',
  category: 'contracting',
  riskLevel: 'low',
  learningObjective: 'lo',
  scenarioText: 'st',
  playerChoices: [
    { id: 'a', label: 'a', consequence: 'c', scoreDelta: { knowledge: 1 } },
    { id: 'b', label: 'b', consequence: 'c', scoreDelta: { knowledge: -1 } },
  ],
  redFlags: [],
  legitimateWorkarounds: [],
  acceptanceChecks: ['ac'],
  sourceIds: ['s1'],
  status: 'draft',
  expertReview: { required: true, status: 'not_requested' },
};

describe('contentItemSchema', () => {
  it('accepts a well-formed item', () => {
    expect(contentItemSchema.safeParse(validItem).success).toBe(true);
  });

  it('rejects an item with fewer than two choices', () => {
    const bad = { ...validItem, playerChoices: [validItem.playerChoices[0]] };
    expect(contentItemSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown extra keys (strict)', () => {
    const bad = { ...validItem, surprise: true };
    expect(contentItemSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an invalid category', () => {
    const bad = { ...validItem, category: 'nope' };
    expect(contentItemSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an unknown scoreDelta dimension', () => {
    const bad = {
      ...validItem,
      playerChoices: [
        { id: 'a', label: 'a', consequence: 'c', scoreDelta: { luck: 1 } },
        validItem.playerChoices[1],
      ],
    };
    expect(contentItemSchema.safeParse(bad).success).toBe(false);
  });
});

describe('levelPackSchema', () => {
  it('accepts an empty (stub) level pack', () => {
    const stub = {
      level: { id: 'level-2', order: 2, title: 'T', intro: 'i', available: false },
      items: [],
      cards: [],
    };
    expect(levelPackSchema.safeParse(stub).success).toBe(true);
  });
});
