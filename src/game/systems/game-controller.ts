/**
 * GameController — the orchestration layer between the UI and the pure domain.
 *
 * Holds the loaded GameProgress, mutates it through the domain reducers, and
 * persists after every change. It deliberately contains no rendering logic so
 * it can be exercised in isolation.
 */

import { summarizeScore, type LevelScoreSummary } from '../../domain/scoring';
import {
  createEmptyLevelProgress,
  createEmptyProgress,
  getLevelProgress,
  loadProgress,
  resetProgress,
  resolveStorage,
  saveProgress,
  type GameProgress,
  type LevelProgress,
  type StorageLike,
} from '../../domain/progress';
import {
  applyChoice,
  canCompleteLevel,
  recordAuditChecklist,
  requiredRedFlags,
  reviewRedFlag,
  suggestedAuditChecklist,
  type GateResult,
} from '../../domain/stage-gate';
import type { LearningCard, LevelPack, PlayerChoice } from '../../domain/types';
import { getCard, getLevelPack } from './content';

export interface ChoiceResult {
  itemId: string;
  choice: PlayerChoice;
  unlockedCards: LearningCard[];
}

export interface CompletionResult {
  ok: boolean;
  gate: GateResult;
  summary?: LevelScoreSummary;
}

export class GameController {
  private progress: GameProgress;
  private readonly storage: StorageLike;
  private activeLevelId: string | null = null;

  constructor(storage: StorageLike = resolveStorage()) {
    this.storage = storage;
    this.progress = loadProgress(storage);
  }

  getProgress(): GameProgress {
    return this.progress;
  }

  isLevelCompleted(levelId: string): boolean {
    return this.progress.levels[levelId]?.completed === true;
  }

  resetAll(): void {
    resetProgress(this.storage);
    this.progress = createEmptyProgress();
    this.activeLevelId = null;
  }

  enterLevel(levelId: string): LevelPack {
    const pack = getLevelPack(levelId);
    if (!pack) throw new Error(`Unknown level: ${levelId}`);
    if (!pack.level.available) throw new Error(`Level not available: ${levelId}`);
    this.activeLevelId = levelId;
    if (!this.progress.levels[levelId]) {
      this.progress.levels[levelId] = createEmptyLevelProgress(levelId);
    }
    if (!this.progress.startedAt) {
      this.progress.startedAt = new Date().toISOString();
    }
    this.progress.lastLevelId = levelId;
    this.persist();
    return pack;
  }

  getActivePack(): LevelPack {
    if (!this.activeLevelId) throw new Error('No active level');
    const pack = getLevelPack(this.activeLevelId);
    if (!pack) throw new Error('Active level missing');
    return pack;
  }

  getActiveLevelProgress(): LevelProgress {
    return getLevelProgress(this.progress, this.getActivePack().level.id);
  }

  choose(itemId: string, choiceId: string): ChoiceResult {
    const pack = this.getActivePack();
    const current = getLevelProgress(this.progress, pack.level.id);
    const item = pack.items.find((i) => i.id === itemId);
    const choice = item?.playerChoices.find((c) => c.id === choiceId);
    if (!item || !choice) {
      throw new Error(`Unknown item/choice: ${itemId}/${choiceId}`);
    }

    const { progress: updated, unlocked } = applyChoice(pack, current, itemId, choiceId);
    this.progress.levels[pack.level.id] = updated;

    const unlockedCards: LearningCard[] = [];
    for (const cardId of unlocked) {
      const card = getCard(cardId);
      if (card) {
        unlockedCards.push(card);
        if (!this.progress.unlockedCardIds.includes(cardId)) {
          this.progress.unlockedCardIds.push(cardId);
        }
      }
    }

    this.persist();
    return { itemId, choice, unlockedCards };
  }

  requiredRedFlags(): string[] {
    return requiredRedFlags(this.getActivePack());
  }

  reviewFlag(flag: string): void {
    const pack = this.getActivePack();
    const current = getLevelProgress(this.progress, pack.level.id);
    this.progress.levels[pack.level.id] = reviewRedFlag(current, flag);
    this.persist();
  }

  isFlagReviewed(flag: string): boolean {
    return this.getActiveLevelProgress().reviewedRedFlags.includes(flag);
  }

  suggestedAudit(): string[] {
    return suggestedAuditChecklist(this.getActivePack());
  }

  finalizeAudit(): string[] {
    const pack = this.getActivePack();
    const current = getLevelProgress(this.progress, pack.level.id);
    const checklist = suggestedAuditChecklist(pack);
    this.progress.levels[pack.level.id] = recordAuditChecklist(current, checklist);
    this.persist();
    return checklist;
  }

  gate(): GateResult {
    const pack = this.getActivePack();
    return canCompleteLevel(pack, getLevelProgress(this.progress, pack.level.id));
  }

  completeLevel(): CompletionResult {
    const pack = this.getActivePack();
    const lp = getLevelProgress(this.progress, pack.level.id);
    const gate = canCompleteLevel(pack, lp);
    if (!gate.ok) {
      return { ok: false, gate };
    }
    const completed: LevelProgress = { ...lp, completed: true };
    this.progress.levels[pack.level.id] = completed;
    this.persist();
    return { ok: true, gate, summary: summarizeScore(completed.score, pack) };
  }

  scoreSummary(): LevelScoreSummary {
    const pack = this.getActivePack();
    return summarizeScore(getLevelProgress(this.progress, pack.level.id).score, pack);
  }

  getUnlockedCards(): LearningCard[] {
    return this.progress.unlockedCardIds
      .map((id) => getCard(id))
      .filter((c): c is LearningCard => c !== undefined);
  }

  private persist(): void {
    saveProgress(this.progress, this.storage);
  }
}
