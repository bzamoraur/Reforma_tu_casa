import { beforeEach, describe, expect, it } from 'vitest';
import {
  PROGRESS_STORAGE_KEY,
  createEmptyProgress,
  getLevelProgress,
  loadProgress,
  resetProgress,
  saveProgress,
  type StorageLike,
} from '../domain/progress';

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

describe('progress persistence', () => {
  it('returns empty progress when nothing is stored', () => {
    expect(loadProgress(storage)).toEqual(createEmptyProgress());
  });

  it('round-trips a saved progress object', () => {
    const p = createEmptyProgress();
    p.startedAt = '2026-01-01T00:00:00.000Z';
    p.unlockedCardIds.push('card-x');
    p.levels['level-1'] = {
      levelId: 'level-1',
      choices: { i1: 'good' },
      reviewedRedFlags: ['flag'],
      auditChecklist: ['check'],
      score: { safety: 1, quality: 0, budget: 0, time: 0, knowledge: 2, trust: 0 },
      completed: true,
    };
    expect(saveProgress(p, storage)).toBe(true);
    const loaded = loadProgress(storage);
    expect(loaded).toEqual(p);
    expect(loaded.levels['level-1'].completed).toBe(true);
  });

  it('discards corrupt JSON and returns empty progress', () => {
    storage.setItem(PROGRESS_STORAGE_KEY, '{not valid json');
    expect(loadProgress(storage)).toEqual(createEmptyProgress());
  });

  it('discards progress with an unknown version', () => {
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 99, levels: {}, unlockedCardIds: [] }),
    );
    expect(loadProgress(storage)).toEqual(createEmptyProgress());
  });

  it('resets stored progress', () => {
    saveProgress(createEmptyProgress(), storage);
    resetProgress(storage);
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it('lazily creates per-level progress without persisting', () => {
    const p = createEmptyProgress();
    const lp = getLevelProgress(p, 'level-1');
    expect(lp.levelId).toBe('level-1');
    expect(lp.completed).toBe(false);
    expect(p.levels['level-1']).toBeUndefined();
  });
});
