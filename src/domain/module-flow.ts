/**
 * Pure domain logic for the spatial game's renovation MODULES (ADR-0006).
 *
 * A project advances LEARN → DECIDE → (on mastery) TRANSFORM. The DECIDE beat
 * reuses the level-style ContentItem, so we reuse the scoring engine. Mastery is
 * a HARD GATE WITH RETRY: the player must pick the recommended option to master
 * the module (and fire the room transform); a wrong pick is recorded, feedback
 * is shown, and they may try again. Room and house state are DERIVED from the
 * per-project progress, never stored separately.
 */
import { findChoice } from './scoring';
import { createEmptyProjectProgress, type ProjectProgress } from './progress';
import type { HousePack, Project, Room, RoomVisualState } from './spatial-types';
import type { PlayerChoice } from './types';

export function getProjectProgress(
  projects: Record<string, ProjectProgress>,
  projectId: string,
): ProjectProgress {
  return projects[projectId] ?? createEmptyProjectProgress(projectId);
}

/** Mark the LEARN brief as seen (teach-before-test). */
export function acknowledgeLearn(pp: ProjectProgress): ProjectProgress {
  return { ...pp, learnAcknowledged: true };
}

export interface DecideResult {
  progress: ProjectProgress;
  /** True when the chosen option is the recommended one (mastery). */
  passed: boolean;
  choice: PlayerChoice;
}

/**
 * Apply a decide-beat choice. Hard gate: mastery requires the recommended
 * option. Records the attempt and allows retry until mastered. Once mastered,
 * mastery is sticky (a later re-choice cannot un-master a learned module).
 */
export function decideProject(
  project: Project,
  pp: ProjectProgress,
  choiceId: string,
): DecideResult {
  const choice = findChoice(project.decide, choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for project ${project.id}`);
  const passed = choice.recommended === true;
  const progress: ProjectProgress = {
    ...pp,
    decidedChoiceId: choiceId,
    attempts: pp.attempts + 1,
    mastered: pp.mastered || passed,
  };
  return { progress, passed, choice };
}

export function isProjectMastered(pp: ProjectProgress): boolean {
  return pp.mastered;
}

/** A project is available once all its prerequisite projects are mastered. */
export function projectIsAvailable(
  project: Project,
  projects: Record<string, ProjectProgress>,
): boolean {
  return project.prerequisites.every((id) => getProjectProgress(projects, id).mastered);
}

function projectStarted(pp: ProjectProgress): boolean {
  return pp.learnAcknowledged || pp.attempts > 0 || pp.mastered;
}

/** Derive a room's visual state from its projects' progress. */
export function roomVisualState(
  room: Room,
  projects: Record<string, ProjectProgress>,
): RoomVisualState {
  if (room.projectIds.length === 0) return 'untouched';
  const masteredCount = room.projectIds.filter(
    (id) => getProjectProgress(projects, id).mastered,
  ).length;
  if (masteredCount === room.projectIds.length) return 'renovated';
  const anyStarted = room.projectIds.some((id) => projectStarted(getProjectProgress(projects, id)));
  return anyStarted ? 'in_progress' : 'untouched';
}

export interface HouseSummary {
  renovatedRooms: number;
  totalRooms: number;
  complete: boolean;
}

/** Derive overall house progress (the "Tu piso: N/M estancias" meter). */
export function houseSummary(
  house: HousePack,
  projects: Record<string, ProjectProgress>,
): HouseSummary {
  const total = house.rooms.length;
  const renovated = house.rooms.filter((r) => roomVisualState(r, projects) === 'renovated').length;
  return {
    renovatedRooms: renovated,
    totalRooms: total,
    complete: total > 0 && renovated === total,
  };
}
