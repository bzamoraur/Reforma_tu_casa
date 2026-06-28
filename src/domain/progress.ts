/**
 * Progress persistence for the MVP. Uses LocalStorage (no backend, no accounts).
 *
 * The storage backend is injectable so the logic can be unit-tested without a
 * real browser, and so the app degrades gracefully (in-memory fallback) when
 * LocalStorage is unavailable or throws (e.g. private mode quotas).
 */

import { createInitialScore } from './scoring';
import type { ScoreState } from './types';

export const PROGRESS_STORAGE_KEY = 'reforma-quest-madrid:progress:v1';
export const PROGRESS_VERSION = 2 as const;

/** Minimal subset of the Web Storage API that we depend on. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LevelProgress {
  levelId: string;
  /** itemId -> chosen choiceId. Presence means the scenario was decided. */
  choices: Record<string, string>;
  /** Red flags the player has reviewed (acknowledged). */
  reviewedRedFlags: string[];
  /** The audit checklist produced at the end of the level. */
  auditChecklist: string[];
  score: ScoreState;
  completed: boolean;
}

/**
 * Per-project (module) progress for the spatial game (ADR-0006). A project is
 * mastered when the player picked the recommended option in its 'decide' beat
 * (hard gate + retry); mastery is what fires the room's visible transform.
 */
export interface ProjectProgress {
  projectId: string;
  /** The player has seen the LEARN brief. */
  learnAcknowledged: boolean;
  /** The currently chosen decide option (last attempt). */
  decidedChoiceId?: string;
  /** Number of decide attempts (retries allowed until mastered). */
  attempts: number;
  /** True once the recommended option was chosen — gates the transform. */
  mastered: boolean;
}

export interface GameProgress {
  version: typeof PROGRESS_VERSION;
  startedAt?: string;
  lastLevelId?: string;
  levels: Record<string, LevelProgress>;
  unlockedCardIds: string[];
  /** Spatial game: projectId -> module progress. Rooms/house state derive from this. */
  projects: Record<string, ProjectProgress>;
}

export function createEmptyProgress(): GameProgress {
  return {
    version: PROGRESS_VERSION,
    levels: {},
    unlockedCardIds: [],
    projects: {},
  };
}

export function createEmptyProjectProgress(projectId: string): ProjectProgress {
  return { projectId, learnAcknowledged: false, attempts: 0, mastered: false };
}

export function createEmptyLevelProgress(levelId: string): LevelProgress {
  return {
    levelId,
    choices: {},
    reviewedRedFlags: [],
    auditChecklist: [],
    score: createInitialScore(),
    completed: false,
  };
}

/** In-memory fallback used when no Web Storage is available. */
class MemoryStorage implements StorageLike {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const memoryFallback = new MemoryStorage();

/** Resolve a usable storage backend, preferring real LocalStorage. */
export function resolveStorage(): StorageLike {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const ls = (globalThis as { localStorage?: StorageLike }).localStorage;
      if (ls) {
        // Probe — some environments expose localStorage but throw on access.
        const probe = '__rqm_probe__';
        ls.setItem(probe, '1');
        ls.removeItem(probe);
        return ls;
      }
    }
  } catch {
    // fall through to memory
  }
  return memoryFallback;
}

/**
 * Validate that a parsed object is a usable GameProgress of the current version.
 * Unknown/older versions are discarded (returns null) so we never crash on
 * incompatible saved state.
 */
function isCurrentProgress(value: unknown): value is GameProgress {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<GameProgress>;
  return (
    v.version === PROGRESS_VERSION &&
    typeof v.levels === 'object' &&
    v.levels !== null &&
    Array.isArray(v.unlockedCardIds)
  );
}

export function loadProgress(storage: StorageLike = resolveStorage()): GameProgress {
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed: unknown = JSON.parse(raw);
    // Backfill the projects map for forward-compatibility within v2.
    if (isCurrentProgress(parsed)) return { ...parsed, projects: parsed.projects ?? {} };
    return createEmptyProgress();
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(
  progress: GameProgress,
  storage: StorageLike = resolveStorage(),
): boolean {
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function resetProgress(storage: StorageLike = resolveStorage()): void {
  try {
    storage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Get (or lazily create) the progress record for a level. Does not persist. */
export function getLevelProgress(progress: GameProgress, levelId: string): LevelProgress {
  return progress.levels[levelId] ?? createEmptyLevelProgress(levelId);
}
