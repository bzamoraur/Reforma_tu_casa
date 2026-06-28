import { beforeEach, describe, expect, it } from 'vitest';
import { GameController } from '../game/systems/game-controller';
import { UIController } from '../game/ui/ui-controller';
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
let gc: GameController;

beforeEach(() => {
  root = document.createElement('div');
  gc = new GameController(new FakeStorage());
  new UIController(root, gc).start();
});

function q(testid: string): HTMLElement | null {
  return root.querySelector(`[data-testid="${testid}"]`);
}
function startLevel(levelId: string): void {
  const btn = root.querySelector<HTMLButtonElement>(
    `[data-testid="start-level"][data-level-id="${levelId}"]`,
  );
  if (!btn) throw new Error(`start button for ${levelId} not found`);
  btn.click();
}
function clickChoice(choiceId: string): void {
  const btn = root.querySelector<HTMLButtonElement>(
    `[data-testid="choice"][data-choice-id="${choiceId}"]`,
  );
  if (!btn) throw new Error(`choice ${choiceId} not found`);
  btn.click();
}
function recommendedFor(index: number): string {
  const item = gc.getActivePack().items[index];
  return (item.playerChoices.find((c) => c.recommended) ?? item.playerChoices[0]).id;
}
/** Play the active level via recommended choices through to the scorecard. */
function playActiveToScorecard(): void {
  const count = gc.getActivePack().items.length;
  for (let i = 0; i < count; i++) {
    clickChoice(recommendedFor(i));
    (q('next') as HTMLButtonElement).click();
  }
  (q('review-all') as HTMLButtonElement).click();
  (q('generate-audit') as HTMLButtonElement).click();
  (q('finish-level') as HTMLButtonElement).click();
}

describe('UIController', () => {
  it('renders the menu with a level list offering the available levels', () => {
    expect(q('level-list')).not.toBeNull();
    expect(
      root.querySelector('[data-testid="start-level"][data-level-id="level-1"]'),
    ).not.toBeNull();
    // Levels 2 and 3 are now playable and must also be offered.
    expect(
      root.querySelector('[data-testid="start-level"][data-level-id="level-2"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="start-level"][data-level-id="level-3"]'),
    ).not.toBeNull();
    expect(q('scenario')).toBeNull();
  });

  it('shows the level briefing on the first scenario only', () => {
    startLevel('level-1');
    const intro = q('level-intro');
    expect(intro).not.toBeNull();
    expect(intro?.textContent).toBe(gc.getActivePack().level.intro);
    // Advance past the first decision; the briefing should no longer show.
    clickChoice(recommendedFor(0));
    (q('next') as HTMLButtonElement).click();
    expect(q('level-intro')).toBeNull();
  });

  it('routes menu → scenarios → audit → scorecard and persists completion', () => {
    startLevel('level-1');
    expect(q('scenario')).not.toBeNull();

    const count = gc.getActivePack().items.length;
    for (let i = 0; i < count; i++) {
      clickChoice(recommendedFor(i));
      expect(q('feedback')).not.toBeNull();
      expect(q('result-marker')?.textContent).toContain('Buena elección');
      expect(q('score-chips')).not.toBeNull();
      (q('next') as HTMLButtonElement).click();
    }

    expect(q('audit')).not.toBeNull();
    (q('review-all') as HTMLButtonElement).click();
    (q('generate-audit') as HTMLButtonElement).click();
    const finish = q('finish-level') as HTMLButtonElement;
    expect(finish.disabled).toBe(false);
    finish.click();

    expect(q('scorecard')).not.toBeNull();
    expect(root.querySelectorAll('.dim-row').length).toBe(6);

    (q('back-to-menu') as HTMLButtonElement).click();
    expect(q('progress-badge')).not.toBeNull();
  });

  it('offers and completes Level 2 end-to-end, then offers Level 3', () => {
    startLevel('level-2');
    expect(q('scenario')).not.toBeNull();
    expect(gc.getActivePack().level.id).toBe('level-2');

    playActiveToScorecard();

    expect(q('scorecard')).not.toBeNull();
    expect(gc.isLevelCompleted('level-2')).toBe(true);
    expect((q('next-level') as HTMLButtonElement | null)?.dataset.levelId).toBe('level-3');
  });

  it('offers and completes Level 3 end-to-end (the last available level)', () => {
    startLevel('level-3');
    expect(q('scenario')).not.toBeNull();
    expect(gc.getActivePack().level.id).toBe('level-3');

    playActiveToScorecard();

    expect(q('scorecard')).not.toBeNull();
    expect(gc.isLevelCompleted('level-3')).toBe(true);
    // Level 3 is currently the last available level, so no "next level" button.
    expect(q('next-level')).toBeNull();
  });

  it('offers progression to the next level from the Level 1 scorecard', () => {
    startLevel('level-1');
    playActiveToScorecard();
    expect(q('scorecard')).not.toBeNull();

    const next = q('next-level') as HTMLButtonElement | null;
    expect(next).not.toBeNull();
    expect(next?.dataset.levelId).toBe('level-2');
    next?.click();

    expect(q('scenario')).not.toBeNull();
    expect(gc.getActivePack().level.id).toBe('level-2');
  });

  it('surfaces the better option when a non-recommended choice is picked', () => {
    startLevel('level-1');
    const item = gc.getActivePack().items[0];
    const bad = item.playerChoices.find((c) => !c.recommended);
    clickChoice(bad!.id);
    expect(q('result-marker')?.textContent).toContain('Había una opción mejor');
    expect(q('better-option')).not.toBeNull();
  });

  it('keeps finish-level disabled until the gate is satisfied', () => {
    startLevel('level-1');
    const count = gc.getActivePack().items.length;
    for (let i = 0; i < count; i++) {
      clickChoice(gc.getActivePack().items[i].playerChoices[0].id);
      (q('next') as HTMLButtonElement).click();
    }
    expect(q('audit')).not.toBeNull();
    expect((q('finish-level') as HTMLButtonElement).disabled).toBe(true);
  });
});
