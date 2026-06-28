import { describe, expect, it } from 'vitest';
import {
  getAllLevels,
  getAvailableLevels,
  getCard,
  getLevelPack,
  getSource,
} from '../game/systems/content';

describe('content registry', () => {
  it('loads and validates all five level packs in order', () => {
    const levels = getAllLevels();
    expect(levels).toHaveLength(5);
    expect(levels.map((l) => l.level.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('exposes exactly one available level in the MVP (Level 1)', () => {
    const available = getAvailableLevels();
    expect(available).toHaveLength(1);
    expect(available[0].level.id).toBe('level-1');
  });

  it('Level 1 has at least five decision scenarios', () => {
    const pack = getLevelPack('level-1');
    expect(pack).toBeDefined();
    expect((pack?.items.length ?? 0) >= 5).toBe(true);
  });

  it('every Level 1 item is draft or pending_expert_review (never verified)', () => {
    const pack = getLevelPack('level-1');
    for (const item of pack?.items ?? []) {
      expect(['draft', 'pending_expert_review']).toContain(item.status);
    }
  });

  it('resolves a known card and source, and undefined for unknown ids', () => {
    expect(getCard('card-l1-itemized-scope')?.levelId).toBe('level-1');
    expect(getCard('nope')).toBeUndefined();
    expect(getSource('src-documentation-practice')).toBeDefined();
    expect(getSource('nope')).toBeUndefined();
  });

  it('every referenced card unlock exists in the content', () => {
    const pack = getLevelPack('level-1');
    for (const item of pack?.items ?? []) {
      for (const choice of item.playerChoices) {
        for (const cardId of choice.unlocks ?? []) {
          expect(getCard(cardId), `missing card ${cardId}`).toBeDefined();
        }
      }
    }
  });
});
