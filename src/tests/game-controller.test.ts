import { beforeEach, describe, expect, it } from 'vitest';
import { GameController } from '../game/systems/game-controller';
import type { StorageLike } from '../domain/progress';

class FakeStorage implements StorageLike {
  store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, v);
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
}

let storage: FakeStorage;
beforeEach(() => {
  storage = new FakeStorage();
});

function playToCompletion(gc: GameController): void {
  const pack = gc.getActivePack();
  for (const item of pack.items) {
    const rec = item.playerChoices.find((c) => c.recommended) ?? item.playerChoices[0];
    gc.choose(item.id, rec.id);
  }
  for (const flag of gc.requiredRedFlags()) gc.reviewFlag(flag);
  gc.finalizeAudit();
}

describe('GameController — error branches', () => {
  it('throws on unknown or unavailable levels', () => {
    const gc = new GameController(storage);
    expect(() => gc.enterLevel('nope')).toThrow(/Unknown level/);
    // level-4 remains an unavailable stub (levels 1-3 are now playable).
    expect(() => gc.enterLevel('level-4')).toThrow(/not available/);
  });

  it('throws when accessing the active pack before entering a level', () => {
    const gc = new GameController(storage);
    expect(() => gc.getActivePack()).toThrow(/No active level/);
  });

  it('throws on unknown item or choice ids', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    expect(() => gc.choose('nope', 'x')).toThrow();
    expect(() => gc.choose('l1-vague-scope', 'nope')).toThrow();
  });
});

describe('GameController — choices and unlocks', () => {
  it('returns the choice and unlocked cards, and does not duplicate unlocks', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    const r1 = gc.choose('l1-vague-scope', 'ask-itemized');
    expect(r1.choice.id).toBe('ask-itemized');
    expect(r1.unlockedCards.map((c) => c.id)).toContain('card-l1-itemized-scope');

    const before = gc.getProgress().unlockedCardIds.length;
    gc.choose('l1-vague-scope', 'ask-itemized'); // idempotent re-choose
    expect(gc.getProgress().unlockedCardIds.length).toBe(before);
  });

  it('persists after entering a level (startedAt, lastLevelId, key written)', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    expect(gc.getProgress().lastLevelId).toBe('level-1');
    expect(gc.getProgress().startedAt).toBeTruthy();
    expect(storage.store.size).toBeGreaterThan(0);
  });
});

describe('GameController — completion gating', () => {
  it('refuses to complete before the gate is satisfied', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    const result = gc.completeLevel();
    expect(result.ok).toBe(false);
    expect(result.summary).toBeUndefined();
    expect(gc.isLevelCompleted('level-1')).toBe(false);
  });

  it('completes the level once decisions, red flags and audit are done', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    expect(gc.gate().ok).toBe(false);
    playToCompletion(gc);
    expect(gc.gate().ok).toBe(true);
    const result = gc.completeLevel();
    expect(result.ok).toBe(true);
    expect(result.summary?.overallRating).toBeDefined();
    expect(gc.isLevelCompleted('level-1')).toBe(true);
  });
});

describe('GameController — persistence across instances', () => {
  it('a second controller over the same storage sees the completed level', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    playToCompletion(gc);
    gc.completeLevel();

    const gc2 = new GameController(storage);
    expect(gc2.isLevelCompleted('level-1')).toBe(true);
  });

  it('resetAll clears storage and active level', () => {
    const gc = new GameController(storage);
    gc.enterLevel('level-1');
    gc.resetAll();
    expect(gc.isLevelCompleted('level-1')).toBe(false);
    expect(() => gc.getActivePack()).toThrow(/No active level/);
    const gc2 = new GameController(storage);
    expect(gc2.getProgress().levels['level-1']).toBeUndefined();
  });
});
