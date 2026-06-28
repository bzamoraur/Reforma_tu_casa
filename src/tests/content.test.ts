import { describe, expect, it } from 'vitest';
import { getAllLevels, getAvailableLevels, getCard, getSource } from '../game/systems/content';

describe('content registry', () => {
  it('loads and validates all five level packs in order', () => {
    const levels = getAllLevels();
    expect(levels).toHaveLength(5);
    expect(levels.map((l) => l.level.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('exposes the playable levels in order', () => {
    const available = getAvailableLevels();
    expect(available.map((l) => l.level.id)).toEqual(['level-1', 'level-2', 'level-3']);
  });

  it('every available level has at least five decision scenarios', () => {
    for (const pack of getAvailableLevels()) {
      expect(pack.items.length, `${pack.level.id} needs >= 5 items`).toBeGreaterThanOrEqual(5);
    }
  });

  it('every item in every available level is draft or pending_expert_review (never verified)', () => {
    for (const pack of getAvailableLevels()) {
      for (const item of pack.items) {
        expect(['draft', 'pending_expert_review'], `${item.id} status`).toContain(item.status);
      }
      for (const card of pack.cards) {
        expect(['draft', 'pending_expert_review'], `${card.id} status`).toContain(card.status);
      }
    }
  });

  it('resolves a known card and source, and undefined for unknown ids', () => {
    expect(getCard('card-l1-itemized-scope')?.levelId).toBe('level-1');
    expect(getCard('nope')).toBeUndefined();
    expect(getSource('src-documentation-practice')).toBeDefined();
    expect(getSource('nope')).toBeUndefined();
  });

  it('every referenced card unlock exists in the content', () => {
    for (const pack of getAvailableLevels()) {
      for (const item of pack.items) {
        for (const choice of item.playerChoices) {
          for (const cardId of choice.unlocks ?? []) {
            expect(getCard(cardId), `missing card ${cardId}`).toBeDefined();
          }
        }
      }
    }
  });
});
