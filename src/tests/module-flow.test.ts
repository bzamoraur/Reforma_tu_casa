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

function recommendedOf(id: string) {
  const p = house.projects.find((x) => x.id === id)!;
  return p.decide.playerChoices.find((c) => c.recommended)!;
}

function masteredOnly(...ids: string[]): Record<string, ProjectProgress> {
  const map: Record<string, ProjectProgress> = {};
  for (const id of ids) {
    const p = house.projects.find((x) => x.id === id)!;
    map[id] = decideProject(p, createEmptyProjectProgress(id), recommendedOf(id).id).progress;
  }
  return map;
}

/** Every project in the (salon) pack mastered — the room's fully-renovated state. */
function masteredMap(): Record<string, ProjectProgress> {
  return masteredOnly(...house.projects.map((p) => p.id));
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

  it('gates a project behind its prerequisites (lighting needs the floor first)', () => {
    const lighting = house.projects.find((p) => p.id === 'salon-lighting')!;
    expect(lighting.prerequisites).toContain('salon-flooring');
    expect(projectIsAvailable(lighting, {})).toBe(false);
    expect(projectIsAvailable(lighting, masteredOnly('salon-flooring'))).toBe(true);
  });

  it('scores each distinct option once — costed retry, no farming', () => {
    const pp0 = createEmptyProjectProgress(project.id);
    const r1 = decideProject(project, pp0, wrong.id);
    expect(r1.scoreDelta).toEqual(wrong.scoreDelta); // first try: counts

    const r2 = decideProject(project, r1.progress, wrong.id);
    expect(r2.scoreDelta).toBeNull(); // same option again: does not double-count

    const r3 = decideProject(project, r2.progress, recommended.id);
    expect(r3.scoreDelta).toEqual(recommended.scoreDelta); // a new option: counts
    expect(r3.progress.scoredChoiceIds).toEqual([wrong.id, recommended.id]);
  });
});
