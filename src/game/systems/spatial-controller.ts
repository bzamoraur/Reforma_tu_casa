/**
 * SpatialController — orchestration for the room-by-room game (ADR-0006).
 *
 * Holds the loaded GameProgress, mutates per-project progress through the pure
 * module-flow reducers, and persists after every change. No rendering logic, so
 * it can be exercised in isolation (mirrors GameController for the legacy track).
 */
import {
  createEmptyProgress,
  loadProgress,
  resetProgress,
  resolveStorage,
  saveProgress,
  type GameProgress,
  type ProjectProgress,
  type StorageLike,
} from '../../domain/progress';
import { applyScoreDelta } from '../../domain/scoring';
import type { ScoreState } from '../../domain/types';
import {
  acknowledgeLearn,
  decideProject,
  getProjectProgress,
  houseSummary,
  projectIsAvailable,
  roomVisualState,
  type DecideResult,
  type HouseSummary,
} from '../../domain/module-flow';
import type { HousePack, Project, Room, RoomVisualState } from '../../domain/spatial-types';
import { getHouse, getProject, getRoom, getRooms } from './content';

export class SpatialController {
  private progress: GameProgress;
  private readonly storage: StorageLike;

  constructor(storage: StorageLike = resolveStorage()) {
    this.storage = storage;
    this.progress = loadProgress(storage);
  }

  getProgress(): GameProgress {
    return this.progress;
  }

  getHouse(): HousePack {
    return getHouse();
  }

  getRooms(): Room[] {
    return getRooms();
  }

  getRoom(roomId: string): Room {
    const room = getRoom(roomId);
    if (!room) throw new Error(`Unknown room: ${roomId}`);
    return room;
  }

  getProject(projectId: string): Project {
    const project = getProject(projectId);
    if (!project) throw new Error(`Unknown project: ${projectId}`);
    return project;
  }

  roomState(roomId: string): RoomVisualState {
    return roomVisualState(this.getRoom(roomId), this.progress.projects);
  }

  houseSummary(): HouseSummary {
    return houseSummary(getHouse(), this.progress.projects);
  }

  projectProgress(projectId: string): ProjectProgress {
    return getProjectProgress(this.progress.projects, projectId);
  }

  isProjectAvailable(projectId: string): boolean {
    return projectIsAvailable(this.getProject(projectId), this.progress.projects);
  }

  /** Mark the LEARN brief seen (also flips the room to in-progress). */
  enterModule(projectId: string): void {
    this.progress.projects[projectId] = acknowledgeLearn(this.projectProgress(projectId));
    if (!this.progress.startedAt) this.progress.startedAt = new Date().toISOString();
    this.persist();
  }

  /** Apply a decide choice (hard gate + retry). Mastery fires the transform. */
  decide(projectId: string, choiceId: string): DecideResult {
    const result = decideProject(
      this.getProject(projectId),
      this.projectProgress(projectId),
      choiceId,
    );
    this.progress.projects[projectId] = result.progress;
    // Costed retry: fold this option's delta into the running house score (once
    // per distinct option — module-flow returns null when already counted).
    if (result.scoreDelta) {
      this.progress.houseScore = applyScoreDelta(this.progress.houseScore, result.scoreDelta);
    }
    this.persist();
    return result;
  }

  /** The running, house-wide score (illustrative game state, not advice). */
  houseScore(): ScoreState {
    return this.progress.houseScore;
  }

  isMastered(projectId: string): boolean {
    return this.projectProgress(projectId).mastered;
  }

  resetAll(): void {
    resetProgress(this.storage);
    this.progress = createEmptyProgress();
  }

  private persist(): void {
    saveProgress(this.progress, this.storage);
  }
}
