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

describe('UIController', () => {
  it('renders the menu with a start button', () => {
    expect(q('start-game')).not.toBeNull();
    expect(q('scenario')).toBeNull();
  });

  it('routes menu → scenarios → audit → scorecard and persists completion', () => {
    (q('start-game') as HTMLButtonElement).click();
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

  it('surfaces the better option when a non-recommended choice is picked', () => {
    (q('start-game') as HTMLButtonElement).click();
    const item = gc.getActivePack().items[0];
    const bad = item.playerChoices.find((c) => !c.recommended);
    clickChoice(bad!.id);
    expect(q('result-marker')?.textContent).toContain('Había una opción mejor');
    expect(q('better-option')).not.toBeNull();
  });

  it('keeps finish-level disabled until the gate is satisfied', () => {
    (q('start-game') as HTMLButtonElement).click();
    const count = gc.getActivePack().items.length;
    for (let i = 0; i < count; i++) {
      clickChoice(gc.getActivePack().items[i].playerChoices[0].id);
      (q('next') as HTMLButtonElement).click();
    }
    expect(q('audit')).not.toBeNull();
    expect((q('finish-level') as HTMLButtonElement).disabled).toBe(true);
  });
});
