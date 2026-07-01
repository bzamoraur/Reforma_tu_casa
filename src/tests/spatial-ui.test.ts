import { beforeEach, describe, expect, it } from 'vitest';
import { SpatialController } from '../game/systems/spatial-controller';
import { SpatialUIController } from '../game/ui/spatial-ui';
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

let root: HTMLElement;
let storage: FakeStorage;
let sc: SpatialController;

beforeEach(() => {
  root = document.createElement('div');
  storage = new FakeStorage();
  sc = new SpatialController(storage);
  new SpatialUIController(root, sc).start();
});

function q(testid: string): HTMLElement | null {
  return root.querySelector(`[data-testid="${testid}"]`);
}
function pick(selector: string): HTMLButtonElement {
  const el = root.querySelector<HTMLButtonElement>(selector);
  if (!el) throw new Error(`not found: ${selector}`);
  return el;
}
function choiceBtn(id: string): HTMLButtonElement {
  return pick(`[data-testid="choice"][data-choice-id="${id}"]`);
}

/**
 * Drive one module to mastery through the UI, starting from the room screen
 * (its hotspot must be available). Leaves the UI on the transform screen.
 */
function masterModuleViaUI(projectId: string, opts: { withRetry?: boolean } = {}): void {
  pick(`[data-testid="hotspot"][data-project-id="${projectId}"]`).click();
  expect(q('module')?.dataset.step).toBe('learn');
  pick('[data-testid="learn-continue"]').click();
  expect(q('module')?.dataset.step).toBe('decide');

  const project = sc.getProject(projectId);
  if (opts.withRetry) {
    const wrong = project.decide.playerChoices.find((c) => !c.recommended)!;
    choiceBtn(wrong.id).click();
    expect(q('result-marker')?.textContent).toContain('Aún no');
    expect(q('score-chips')).not.toBeNull();
    pick('[data-testid="retry"]').click();
  }
  const right = project.decide.playerChoices.find((c) => c.recommended)!;
  choiceBtn(right.id).click();
  expect(q('result-marker')?.textContent).toContain('Bien decidido');
  pick('[data-testid="to-transform"]').click();
  expect(q('transform')).not.toBeNull();
}

describe('SpatialUIController', () => {
  it('renders the house with its rooms and a progress meter', () => {
    expect(q('house')).not.toBeNull();
    expect(q('house-meter')?.textContent).toContain('0/2');
    expect(pick('[data-testid="room-tile"][data-room-id="salon"]')).not.toBeNull();
    expect(pick('[data-testid="room-tile"][data-room-id="dormitorio"]')).not.toBeNull();
  });

  it('gated hotspot unlocks after its prerequisite; both modules renovate the room', () => {
    // The house shows the illustrative resource HUD.
    expect(q('resource-bars')).not.toBeNull();

    pick('[data-testid="room-tile"][data-room-id="salon"]').click();
    expect(q('room')).not.toBeNull();
    expect(q('room-art')?.dataset.state).toBe('untouched');

    // Lighting is gated behind flooring: its hotspot starts locked + disabled.
    const lockedLight = pick('[data-testid="hotspot"][data-project-id="salon-lighting"]');
    expect(lockedLight.dataset.locked).toBe('true');
    expect(lockedLight.disabled).toBe(true);

    // Module 1 — flooring, with a wrong pick + retry (hard gate).
    masterModuleViaUI('salon-flooring', { withRetry: true });
    // One of two projects done → room still in progress, not yet renovated.
    expect(sc.roomState('salon')).toBe('in_progress');

    // Back in the room, the lighting hotspot is now unlocked.
    pick('[data-testid="back-to-room"]').click();
    const light = pick('[data-testid="hotspot"][data-project-id="salon-lighting"]');
    expect(light.dataset.locked).toBe('false');
    expect(light.disabled).toBe(false);

    // Module 2 — lighting. Now the room is fully renovated.
    masterModuleViaUI('salon-lighting');
    expect(q('room-art')?.dataset.state).toBe('renovated');

    pick('[data-testid="back-to-house"]').click();
    expect(q('house-meter')?.textContent).toContain('1/2');
    expect(pick('[data-testid="room-tile"][data-room-id="salon"]').className).toContain(
      'room-renovated',
    );
  });

  it('accumulates a costed house score; re-picking the same wrong option does not double-count', () => {
    const project = sc.getProject('salon-flooring');
    const badBudget = project.decide.playerChoices.find((c) => (c.scoreDelta.budget ?? 0) < 0)!;
    sc.enterModule('salon-flooring');

    sc.decide('salon-flooring', badBudget.id);
    const afterFirst = sc.houseScore().budget;
    expect(afterFirst).toBeLessThan(0); // a wrong pick leaves a real mark

    sc.decide('salon-flooring', badBudget.id);
    expect(sc.houseScore().budget).toBe(afterFirst); // same option again: no change
  });

  it('persists mastery across controllers and reopens a done hotspot as the result', () => {
    // Master the salón flooring module.
    sc.enterModule('salon-flooring');
    const right = sc.getProject('salon-flooring').decide.playerChoices.find((c) => c.recommended)!;
    sc.decide('salon-flooring', right.id);

    const sc2 = new SpatialController(storage);
    expect(sc2.isMastered('salon-flooring')).toBe(true);

    new SpatialUIController(root, sc2).start();
    pick('[data-testid="room-tile"][data-room-id="salon"]').click();
    const hotspot = pick('[data-testid="hotspot"][data-project-id="salon-flooring"]');
    expect(hotspot.className).toContain('hotspot-done');
    hotspot.click();
    expect(q('transform')).not.toBeNull();
  });
});
