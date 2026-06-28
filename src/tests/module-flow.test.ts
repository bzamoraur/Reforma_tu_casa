import { describe, expect, it } from 'vitest';
import { housePackSchema } from '../domain/spatial-schema';
import type { HousePack } from '../domain/spatial-types';
import { createEmptyProjectProgress, type ProjectProgress } from '../domain/progress';
import {
  acknowledgeLearn,
  decideProject,
  houseSummary,
  projectIsAvailable,
  roomVisualState,
} from '../domain/module-flow';
import salon from '../content/rooms/salon.json';

const house = housePackSchema.parse(salon) as unknown as HousePack;
const project = house.projects[0];
const room = house.rooms[0];
const recommended = project.decide.playerChoices.find((c) => c.recommended)!;
const wrong = project.decide.playerChoices.find((c) => !c.recommended)!;

function masteredMap(): Record<string, ProjectProgress> {
  return {
    [project.id]: decideProject(project, createEmptyProjectProgress(project.id), recommended.id)
      .progress,
  };
}

describe('module flow', () => {
  it('teaches before testing and gates the transform on mastery (hard gate + retry)', () => {
    let pp = createEmptyProjectProgress(project.id);
    pp = acknowledgeLearn(pp);
    expect(pp.learnAcknowledged).toBe(true);

    const r1 = decideProject(project, pp, wrong.id);
    expect(r1.passed).toBe(false);
    expect(r1.progress.mastered).toBe(false);
    expect(r1.progress.attempts).toBe(1);

    const r2 = decideProject(project, r1.progress, recommended.id);
    expect(r2.passed).toBe(true);
    expect(r2.progress.mastered).toBe(true);
    expect(r2.progress.attempts).toBe(2);
  });

  it('mastery is sticky (a later wrong pick cannot un-master)', () => {
    const mastered = decideProject(
      project,
      createEmptyProjectProgress(project.id),
      recommended.id,
    ).progress;
    const after = decideProject(project, mastered, wrong.id).progress;
    expect(after.mastered).toBe(true);
  });

  it('derives room and house state from project mastery', () => {
    const none: Record<string, ProjectProgress> = {};
    expect(roomVisualState(room, none)).toBe('untouched');
    expect(houseSummary(house, none).complete).toBe(false);

    const started: Record<string, ProjectProgress> = {
      [project.id]: { ...createEmptyProjectProgress(project.id), learnAcknowledged: true },
    };
    expect(roomVisualState(room, started)).toBe('in_progress');

    const done = masteredMap();
    expect(roomVisualState(room, done)).toBe('renovated');
    expect(houseSummary(house, done)).toEqual({ renovatedRooms: 1, totalRooms: 1, complete: true });
  });

  it('throws on an unknown choice id', () => {
    expect(() => decideProject(project, createEmptyProjectProgress(project.id), 'nope')).toThrow();
  });

  it('a project with no prerequisites is always available', () => {
    expect(projectIsAvailable(project, {})).toBe(true);
  });
});
