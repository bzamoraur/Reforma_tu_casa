/**
 * SpatialUIController — the room-by-room game loop (ADR-0006), rendered as an
 * accessible HTML/CSS overlay (Phaser stays a lazy decorative backdrop).
 *
 *   house  →  room (explore + discover hotspots)  →  module
 *                                                     ├─ learn  (teach first)
 *                                                     ├─ decide (test: hard gate + retry)
 *                                                     └─ transform (the room changes)
 *
 * Domain mutation is delegated to SpatialController; this file is presentation
 * only. Key elements carry data-testid attributes for the Playwright e2e suite.
 */
import { SCORE_DIMENSIONS, type ScoreDelta } from '../../domain/types';
import type { DecideResult } from '../../domain/module-flow';
import type { Project, Room, RoomVisualState } from '../../domain/spatial-types';
import type { SpatialController } from '../systems/spatial-controller';
import { getSource } from '../systems/content';
import { clear, el } from './dom';
import { DIMENSION_LABELS, DISCLAIMER } from './labels';

type Screen =
  | { kind: 'house' }
  | { kind: 'room'; roomId: string }
  | { kind: 'module'; projectId: string; step: 'learn' }
  | { kind: 'module'; projectId: string; step: 'decide'; feedback?: DecideResult }
  | { kind: 'module'; projectId: string; step: 'transform' };

const STATE_LABEL: Record<RoomVisualState, string> = {
  untouched: 'Sin reformar',
  in_progress: 'En curso',
  renovated: 'Reformada',
};

function artUrl(roomId: string, assetId: string): string {
  return `/assets/rooms/${roomId}/${assetId}.webp`;
}

function roomArtUrl(room: Room, state: RoomVisualState): string {
  const assetId = state === 'renovated' ? room.art.after : room.art.before;
  return artUrl(room.id, assetId);
}

// --- Resource gauges: an illustrative budget/time/trust HUD -----------------
// Coarse, qualitative words derived from the running house score. NOT a price
// engine and NOT advice — a feedback gauge (like a health bar) that makes the
// red flags the player ignores actually cost something.
export type GaugeTone = 'good' | 'mid' | 'bad';
export type ResourceDim = 'budget' | 'time' | 'trust';

export interface ResourceGauge {
  dim: ResourceDim;
  label: string;
  word: string;
  tone: GaugeTone;
  fillPct: number;
}

const RESOURCE_WORDS: Record<ResourceDim, readonly [bad: string, mid: string, good: string]> = {
  budget: ['en apuros', 'ajustado', 'holgado'],
  time: ['con retraso', 'en plazo', 'con margen'],
  trust: ['a ciegas', 'atento', 'controlas la obra'],
};

export function resourceGauge(dim: ResourceDim, value: number): ResourceGauge {
  const tone: GaugeTone = value >= 2 ? 'good' : value >= 0 ? 'mid' : 'bad';
  const word = RESOURCE_WORDS[dim][tone === 'good' ? 2 : tone === 'mid' ? 1 : 0];
  const clamped = Math.max(-4, Math.min(4, value));
  const fillPct = Math.round(((clamped + 4) / 8) * 100);
  return { dim, label: DIMENSION_LABELS[dim], word, tone, fillPct };
}

export class SpatialUIController {
  private screen: Screen = { kind: 'house' };

  constructor(
    private readonly root: HTMLElement,
    private readonly controller: SpatialController,
  ) {}

  start(): void {
    this.screen = { kind: 'house' };
    this.render();
  }

  private go(screen: Screen): void {
    this.screen = screen;
    this.render();
  }

  private render(): void {
    clear(this.root);
    let view: HTMLElement;
    switch (this.screen.kind) {
      case 'house':
        view = this.renderHouse();
        break;
      case 'room':
        view = this.renderRoom(this.screen.roomId);
        break;
      case 'module':
        view =
          this.screen.step === 'learn'
            ? this.renderLearn(this.screen.projectId)
            : this.screen.step === 'decide'
              ? this.renderDecide(this.screen.projectId, this.screen.feedback)
              : this.renderTransform(this.screen.projectId);
        break;
    }
    this.root.append(view);
  }

  // ---- House ------------------------------------------------------------

  private renderHouse(): HTMLElement {
    const summary = this.controller.houseSummary();
    const anyProgress = Object.keys(this.controller.getProgress().projects).length > 0;

    const grid = el('div', { class: 'room-grid', dataset: { testid: 'room-grid' } });
    for (const room of this.controller.getRooms()) {
      const state = this.controller.roomState(room.id);
      grid.append(
        el(
          'button',
          {
            class: `room-card room-${state}`,
            dataset: { testid: 'room-tile', roomId: room.id },
            onClick: () => this.go({ kind: 'room', roomId: room.id }),
            ariaLabel: `${room.name} — ${STATE_LABEL[state]}`,
          },
          el('span', { class: 'room-card-name', text: room.name }),
          el('span', { class: `room-card-state state-${state}`, text: STATE_LABEL[state] }),
        ),
      );
    }

    return this.panel(
      'house',
      [
        el('h1', { class: 'title', text: this.controller.getHouse().house.name }),
        el('p', { class: 'subtitle', text: 'Reforma tu piso, estancia por estancia.' }),
        el('p', {
          class: summary.complete ? 'badge' : 'muted',
          text: summary.complete
            ? `✓ ¡Piso reformado! ${summary.renovatedRooms}/${summary.totalRooms} estancias`
            : `Tu piso: ${summary.renovatedRooms}/${summary.totalRooms} estancias reformadas`,
          dataset: { testid: 'house-meter' },
        }),
        this.renderResourceBars(),
        grid,
        anyProgress
          ? el('button', {
              class: 'btn btn-ghost btn-small',
              text: 'Reiniciar progreso',
              dataset: { testid: 'reset-progress' },
              onClick: () => {
                this.controller.resetAll();
                this.go({ kind: 'house' });
              },
            })
          : null,
        el('p', { class: 'disclaimer', text: DISCLAIMER }),
      ],
      { testid: 'house' },
    );
  }

  /** The illustrative budget/time/trust HUD, derived from the house score. */
  private renderResourceBars(): HTMLElement {
    const score = this.controller.houseScore();
    const bars = el('div', { class: 'resource-bars', dataset: { testid: 'resource-bars' } });
    for (const dim of ['budget', 'time', 'trust'] as const) {
      const g = resourceGauge(dim, score[dim]);
      const fill = el('div', { class: 'resource-fill' });
      fill.style.width = `${g.fillPct}%`;
      bars.append(
        el(
          'div',
          {
            class: `resource resource-${g.tone}`,
            dataset: { testid: `resource-${dim}` },
            ariaLabel: `${g.label}: ${g.word}`,
          },
          el('span', { class: 'resource-label', text: g.label }),
          el('div', { class: 'resource-track' }, fill),
          el('span', { class: 'resource-word', text: g.word }),
        ),
      );
    }
    return el(
      'div',
      { class: 'resource-hud' },
      bars,
      el('p', {
        class: 'muted resource-note',
        text: 'Estado orientativo de tu reforma según tus decisiones (no son precios reales).',
      }),
    );
  }

  // ---- Room (explore + discover) ----------------------------------------

  private renderRoom(roomId: string): HTMLElement {
    const room = this.controller.getRoom(roomId);
    const state = this.controller.roomState(roomId);

    const stage = el('div', { class: 'room-stage', dataset: { testid: 'room-stage', state } });
    stage.append(
      el('img', {
        class: 'room-art',
        src: roomArtUrl(room, state),
        alt: `${room.name} (${STATE_LABEL[state]})`,
        dataset: { testid: 'room-art', state },
        onError: (ev) => {
          (ev.target as HTMLImageElement).style.display = 'none';
          stage.classList.add('art-missing');
        },
      }),
    );
    for (const hs of room.hotspots) {
      const mastered = this.controller.isMastered(hs.projectId);
      const locked = !mastered && !this.controller.isProjectAvailable(hs.projectId);
      const lockHint = locked ? this.prerequisiteHint(hs.projectId) : '';
      const dot = el('button', {
        class: mastered ? 'hotspot hotspot-done' : locked ? 'hotspot hotspot-locked' : 'hotspot',
        text: mastered ? '✓' : locked ? '🔒' : '?',
        disabled: locked,
        title: locked ? lockHint : hs.label,
        ariaLabel: locked
          ? `${hs.label} (bloqueado): ${lockHint}`
          : `${hs.label}: ${hs.discoverHint}`,
        dataset: {
          testid: 'hotspot',
          projectId: hs.projectId,
          locked: locked ? 'true' : 'false',
        },
        onClick: locked
          ? undefined
          : () => {
              if (this.controller.isMastered(hs.projectId)) {
                this.go({ kind: 'module', projectId: hs.projectId, step: 'transform' });
              } else {
                this.controller.enterModule(hs.projectId);
                this.go({ kind: 'module', projectId: hs.projectId, step: 'learn' });
              }
            },
      });
      // Position the hotspot over the room art (x/y are 0..1 fractions).
      dot.style.left = `${hs.x * 100}%`;
      dot.style.top = `${hs.y * 100}%`;
      stage.append(dot);
    }

    return this.panel(
      'room',
      [
        el('button', {
          class: 'btn btn-ghost btn-small',
          text: '← Volver al piso',
          dataset: { testid: 'to-house' },
          onClick: () => this.go({ kind: 'house' }),
        }),
        el('h2', { class: 'scenario-title', text: room.name }),
        el('p', { class: 'scenario-text', text: room.intro }),
        stage,
        el('p', { class: 'muted', text: 'Pulsa un punto de interés para ver qué se puede hacer.' }),
      ],
      { testid: 'room' },
    );
  }

  // ---- Module: learn (teach first) --------------------------------------

  private renderLearn(projectId: string): HTMLElement {
    const project = this.controller.getProject(projectId);
    return this.panel(
      'module',
      [
        this.moduleHeader(project),
        el(
          'div',
          { class: 'feedback-card' },
          el('strong', { text: `📘 ${project.learn.title}: ` }),
          project.learn.body,
        ),
        this.sourcesLine(project.learn.sourceIds),
        el('button', {
          class: 'btn btn-primary',
          text: 'Lo tengo — a decidir',
          dataset: { testid: 'learn-continue' },
          onClick: () => this.go({ kind: 'module', projectId, step: 'decide' }),
        }),
      ],
      { testid: 'module', step: 'learn' },
    );
  }

  // ---- Module: decide (test — hard gate + retry) ------------------------

  private renderDecide(projectId: string, feedback?: DecideResult): HTMLElement {
    const project = this.controller.getProject(projectId);
    const item = project.decide;

    const children: (HTMLElement | null)[] = [
      this.moduleHeader(project),
      el('p', { class: 'scenario-text', text: item.scenarioText }),
    ];

    if (!feedback) {
      const choices = el('div', { class: 'choices' });
      for (const choice of item.playerChoices) {
        choices.append(
          el('button', {
            class: 'btn choice',
            text: choice.label,
            dataset: { testid: 'choice', choiceId: choice.id },
            onClick: () => {
              const result = this.controller.decide(projectId, choice.id);
              this.go({ kind: 'module', projectId, step: 'decide', feedback: result });
            },
          }),
        );
      }
      children.push(choices);
    } else {
      children.push(this.renderDecideFeedback(projectId, feedback));
    }

    return this.panel('module', children, { testid: 'module', step: 'decide' });
  }

  private renderDecideFeedback(projectId: string, feedback: DecideResult): HTMLElement {
    const { choice, passed } = feedback;
    const blocks: (HTMLElement | null)[] = [
      el('div', {
        class: passed ? 'feedback-result good' : 'feedback-result',
        text: passed ? '✅ ¡Bien decidido!' : '➖ Aún no — vuelve a intentarlo',
        dataset: { testid: 'result-marker' },
      }),
      this.scoreChips(choice.scoreDelta),
      el(
        'div',
        { class: 'feedback-consequence' },
        el('strong', { text: 'Consecuencia: ' }),
        choice.consequence,
      ),
    ];
    if (choice.lesson) {
      blocks.push(
        el(
          'div',
          { class: 'feedback-lesson' },
          el('strong', { text: '💡 Lección: ' }),
          choice.lesson,
        ),
      );
    }
    if (choice.betterQuestion) {
      blocks.push(
        el(
          'div',
          { class: 'feedback-question' },
          el('strong', { text: '❓ Mejor pregunta: ' }),
          choice.betterQuestion,
        ),
      );
    }
    if (choice.redFlag) {
      blocks.push(
        el(
          'div',
          { class: 'feedback-flag' },
          el('strong', { text: '🚩 Señal de alarma: ' }),
          choice.redFlag,
        ),
      );
    }

    blocks.push(
      passed
        ? el('button', {
            class: 'btn btn-primary',
            text: 'Ver cómo queda →',
            dataset: { testid: 'to-transform' },
            onClick: () => this.go({ kind: 'module', projectId, step: 'transform' }),
          })
        : el('button', {
            class: 'btn btn-primary',
            text: 'Reintentar',
            dataset: { testid: 'retry' },
            onClick: () => this.go({ kind: 'module', projectId, step: 'decide' }),
          }),
    );
    return el(
      'div',
      { class: 'feedback', dataset: { testid: 'decide-feedback' } },
      ...blocks.filter((b): b is HTMLElement => b !== null),
    );
  }

  // ---- Module: transform (the room changes) -----------------------------

  private renderTransform(projectId: string): HTMLElement {
    const project = this.controller.getProject(projectId);
    const room = this.controller.getRoom(project.roomId);

    // The transform screen shows THIS project's finished result. A room can host
    // several modules, so prefer the project's own art and fall back to the room.
    const doneArt = project.art ?? room.art;
    const stage = el('div', {
      class: 'room-stage',
      dataset: { testid: 'room-stage', state: 'renovated' },
    });
    stage.append(
      el('img', {
        class: 'room-art',
        src: artUrl(room.id, doneArt.after),
        alt: `${room.name} — ${project.title} (hecho)`,
        dataset: { testid: 'room-art', state: 'renovated' },
        onError: (ev) => {
          (ev.target as HTMLImageElement).style.display = 'none';
          stage.classList.add('art-missing');
        },
      }),
    );

    const checks = el('ul', { class: 'checklist-ul' });
    for (const c of project.decide.acceptanceChecks) checks.append(el('li', { text: c }));

    const agentLine =
      project.transform.agent === 'professional'
        ? `🛠️ Trabajo realizado por: ${project.transform.professionalRouting?.trade ?? 'un profesional'}. ${project.transform.professionalRouting?.note ?? ''}`
        : '🙌 Lo has hecho tú mismo, de forma segura.';

    return this.panel(
      'transform',
      [
        el('div', { class: 'feedback-result good', text: '✨ ¡Estancia reformada!' }),
        stage,
        el('p', { class: 'overall', text: project.transform.caption }),
        el('p', { class: 'feedback-sources muted', text: agentLine }),
        el('h3', { text: 'Está hecho cuando…' }),
        checks,
        el('button', {
          class: 'btn btn-primary',
          text: 'Volver a la estancia',
          dataset: { testid: 'back-to-room' },
          onClick: () => this.go({ kind: 'room', roomId: room.id }),
        }),
        el('button', {
          class: 'btn btn-ghost',
          text: 'Volver al piso',
          dataset: { testid: 'back-to-house' },
          onClick: () => this.go({ kind: 'house' }),
        }),
        el('p', { class: 'disclaimer', text: DISCLAIMER }),
      ],
      { testid: 'transform' },
    );
  }

  // ---- Helpers ----------------------------------------------------------

  private moduleHeader(project: Project): HTMLElement {
    return el(
      'div',
      { class: 'module-head' },
      el('button', {
        class: 'btn btn-ghost btn-small',
        text: '← Volver a la estancia',
        dataset: { testid: 'to-room' },
        onClick: () => this.go({ kind: 'room', roomId: project.roomId }),
      }),
      el('h2', { class: 'scenario-title', text: project.title }),
      el('p', { class: 'muted', text: project.opportunity }),
    );
  }

  /** Player-facing hint for a locked hotspot: which prerequisites remain. */
  private prerequisiteHint(projectId: string): string {
    const project = this.controller.getProject(projectId);
    const pending = project.prerequisites
      .filter((id) => !this.controller.isMastered(id))
      .map((id) => this.controller.getProject(id).title);
    return pending.length > 0 ? `Primero termina: ${pending.join(', ')}` : 'Aún no disponible';
  }

  private scoreChips(delta: ScoreDelta): HTMLElement | null {
    const entries = SCORE_DIMENSIONS.filter((d) => typeof delta[d] === 'number' && delta[d] !== 0);
    if (entries.length === 0) return null;
    const row = el('div', { class: 'chips', dataset: { testid: 'score-chips' } });
    for (const d of entries) {
      const v = delta[d] as number;
      row.append(
        el('span', {
          class: v > 0 ? 'chip chip-pos' : 'chip chip-neg',
          text: `${DIMENSION_LABELS[d]} ${v > 0 ? '+' : ''}${v}`,
        }),
      );
    }
    return row;
  }

  private sourcesLine(sourceIds: string[]): HTMLElement | null {
    const titles = sourceIds.map((id) => getSource(id)?.title).filter((t): t is string => !!t);
    if (titles.length === 0) return null;
    return el('div', {
      class: 'feedback-sources muted',
      text: `Fuentes (en validación): ${titles.join('; ')}`,
    });
  }

  private panel(
    name: string,
    children: (HTMLElement | null)[],
    dataset?: Record<string, string>,
  ): HTMLElement {
    return el(
      'div',
      { class: `panel panel-${name}`, dataset },
      ...children.filter((c): c is HTMLElement => c !== null),
    );
  }
}
