/**
 * UIController — renders the HTML/CSS overlay and drives the core game loop:
 * menu → scenario decisions → audit (red-flag review + checklist) → scorecard.
 *
 * It keeps presentation concerns here and delegates all domain mutation to the
 * GameController. Key interactive elements carry data-testid attributes for the
 * Playwright e2e suite.
 */

import type { LevelScoreSummary } from '../../domain/scoring';
import {
  SCORE_DIMENSIONS,
  type ContentItem,
  type LevelPack,
  type ScoreDelta,
} from '../../domain/types';
import { getAvailableLevels, getNextAvailableLevel, getSource } from '../systems/content';
import { sceneBridge } from '../systems/bridge';
import type { ChoiceResult, GameController } from '../systems/game-controller';
import { clear, el } from './dom';
import { DIMENSION_LABELS, DISCLAIMER, RATING_LABELS, describeGateMissing } from './labels';

type Screen =
  | { kind: 'menu' }
  | { kind: 'scenario'; index: number; feedback?: ChoiceResult }
  | { kind: 'audit' }
  | { kind: 'scorecard'; summary: LevelScoreSummary };

export class UIController {
  private screen: Screen = { kind: 'menu' };

  constructor(
    private readonly root: HTMLElement,
    private readonly controller: GameController,
  ) {}

  start(): void {
    this.screen = { kind: 'menu' };
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
      case 'menu':
        view = this.renderMenu();
        break;
      case 'scenario':
        view = this.renderScenario(this.screen.index, this.screen.feedback);
        break;
      case 'audit':
        view = this.renderAudit();
        break;
      case 'scorecard':
        view = this.renderScorecard(this.screen.summary);
        break;
    }
    this.root.append(view);
  }

  // ---- Menu -------------------------------------------------------------

  private renderMenu(): HTMLElement {
    const levels = getAvailableLevels();
    const anyCompleted = levels.some((p) => this.controller.isLevelCompleted(p.level.id));

    const list = el('div', { class: 'level-list', dataset: { testid: 'level-list' } });
    if (levels.length === 0) {
      list.append(el('p', { class: 'muted', text: 'Próximamente' }));
    }
    for (const pack of levels) {
      const completed = this.controller.isLevelCompleted(pack.level.id);
      list.append(
        el(
          'div',
          { class: completed ? 'level-row completed' : 'level-row' },
          el(
            'div',
            { class: 'level-meta' },
            el('span', {
              class: 'level-name',
              text: `Nivel ${pack.level.order} — ${pack.level.title}`,
            }),
            pack.level.subtitle
              ? el('span', { class: 'level-sub muted', text: pack.level.subtitle })
              : null,
            completed
              ? el('span', {
                  class: 'badge',
                  text: '✓ Completado',
                  dataset: { testid: 'progress-badge', levelId: pack.level.id },
                })
              : null,
          ),
          el('button', {
            class: completed ? 'btn btn-ghost' : 'btn btn-primary',
            text: completed ? 'Volver a jugar' : 'Empezar',
            dataset: { testid: 'start-level', levelId: pack.level.id },
            onClick: () => this.beginLevel(pack.level.id),
          }),
        ),
      );
    }

    return this.panel('menu', [
      el('h1', { class: 'title', text: 'Reforma Quest Madrid' }),
      el('p', {
        class: 'subtitle',
        text: 'Aprende a reformar tu piso en Madrid sin que te la cuelen.',
      }),
      list,
      anyCompleted
        ? el('button', {
            class: 'btn btn-ghost btn-small',
            text: 'Reiniciar progreso',
            dataset: { testid: 'reset-progress' },
            onClick: () => {
              this.controller.resetAll();
              this.go({ kind: 'menu' });
            },
          })
        : null,
      el('p', { class: 'disclaimer', text: DISCLAIMER }),
    ]);
  }

  private beginLevel(levelId: string): void {
    this.controller.enterLevel(levelId);
    sceneBridge.setActiveRoom(0);
    this.go({ kind: 'scenario', index: 0 });
  }

  // ---- Scenario ---------------------------------------------------------

  private renderScenario(index: number, feedback?: ChoiceResult): HTMLElement {
    const pack = this.controller.getActivePack();
    const item = pack.items[index];
    sceneBridge.setActiveRoom(index);

    const progress = el('p', {
      class: 'muted',
      text: `Decisión ${index + 1} de ${pack.items.length}`,
    });

    const children: (HTMLElement | null)[] = [
      // The level's framing briefing, shown once before the first decision.
      index === 0
        ? el('p', {
            class: 'level-intro',
            text: pack.level.intro,
            dataset: { testid: 'level-intro' },
          })
        : null,
      progress,
      el('h2', {
        class: 'scenario-title',
        text: item.title,
        dataset: { testid: 'scenario-title' },
      }),
      el('p', { class: 'scenario-text', text: item.scenarioText }),
    ];

    if (!feedback) {
      children.push(this.renderChoices(item));
    } else {
      children.push(this.renderFeedback(item, feedback, index, pack));
    }

    return this.panel('scenario', children, { testid: 'scenario' });
  }

  private renderChoices(item: ContentItem): HTMLElement {
    const list = el('div', { class: 'choices' });
    for (const choice of item.playerChoices) {
      list.append(
        el('button', {
          class: 'btn choice',
          text: choice.label,
          dataset: { testid: 'choice', choiceId: choice.id },
          onClick: () => {
            const result = this.controller.choose(item.id, choice.id);
            this.go({ kind: 'scenario', index: this.currentIndex(), feedback: result });
          },
        }),
      );
    }
    return list;
  }

  private renderFeedback(
    item: ContentItem,
    feedback: ChoiceResult,
    index: number,
    pack: LevelPack,
  ): HTMLElement {
    const { choice } = feedback;
    const recommended = item.playerChoices.find((c) => c.recommended);
    const isRecommended = choice.recommended === true;

    const blocks: (HTMLElement | null)[] = [
      el('div', {
        class: isRecommended ? 'feedback-result good' : 'feedback-result',
        text: isRecommended ? '✅ Buena elección' : '➖ Había una opción mejor',
        dataset: { testid: 'result-marker' },
      }),
      this.renderScoreChips(choice.scoreDelta),
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

    for (const card of feedback.unlockedCards) {
      blocks.push(
        el(
          'div',
          { class: 'feedback-card' },
          el('strong', { text: `🃏 Carta desbloqueada — ${card.title}: ` }),
          card.body,
        ),
      );
    }

    if (!isRecommended && recommended) {
      const betterText = recommended.betterQuestion
        ? `${recommended.label} — ${recommended.betterQuestion}`
        : recommended.label;
      blocks.push(
        el(
          'div',
          { class: 'feedback-better', dataset: { testid: 'better-option' } },
          el('strong', { text: '⭐ La mejor opción era: ' }),
          betterText,
        ),
      );
    }

    const sourceIds =
      choice.sourceIds && choice.sourceIds.length > 0 ? choice.sourceIds : item.sourceIds;
    const sourceTitles = sourceIds
      .map((id) => getSource(id)?.title)
      .filter((t): t is string => t !== undefined);
    if (sourceTitles.length > 0) {
      blocks.push(
        el(
          'div',
          { class: 'feedback-sources muted' },
          `Fuentes (en validación): ${sourceTitles.join('; ')}`,
        ),
      );
    }

    if (item.expertReview.status !== 'approved') {
      blocks.push(
        el('div', { class: 'feedback-pending', text: 'ⓘ Pendiente de revisión por experto' }),
      );
    }

    const isLast = index >= pack.items.length - 1;
    blocks.push(
      el('button', {
        class: 'btn btn-primary',
        text: isLast ? 'Ir a la auditoría del nivel' : 'Siguiente decisión',
        dataset: { testid: 'next' },
        onClick: () => {
          if (isLast) {
            this.go({ kind: 'audit' });
          } else {
            this.go({ kind: 'scenario', index: index + 1 });
          }
        },
      }),
    );

    return el('div', { class: 'feedback', dataset: { testid: 'feedback' } }, ...blocks);
  }

  private currentIndex(): number {
    return this.screen.kind === 'scenario' ? this.screen.index : 0;
  }

  /** A row of "Dimensión ±N" chips for the choice's score impact (or null). */
  private renderScoreChips(delta: ScoreDelta): HTMLElement | null {
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

  // ---- Audit ------------------------------------------------------------

  private renderAudit(): HTMLElement {
    const pack = this.controller.getActivePack();
    const flags = this.controller.requiredRedFlags();
    const auditDone = this.controller.getActiveLevelProgress().auditChecklist.length > 0;
    const allReviewed = flags.every((f) => this.controller.isFlagReviewed(f));

    const reviewAll = el('button', {
      class: 'btn btn-small',
      text: allReviewed ? '✓ Todas revisadas' : 'Revisar todas',
      disabled: allReviewed,
      dataset: { testid: 'review-all' },
      onClick: () => {
        for (const flag of flags) this.controller.reviewFlag(flag);
        this.go({ kind: 'audit' });
      },
    });

    const flagList = el('div', { class: 'flag-list' });
    for (const flag of flags) {
      const reviewed = this.controller.isFlagReviewed(flag);
      flagList.append(
        el(
          'div',
          { class: reviewed ? 'flag-row reviewed' : 'flag-row' },
          el('span', { class: 'flag-text', text: `🚩 ${flag}` }),
          el('button', {
            class: 'btn btn-small',
            text: reviewed ? '✓ Revisada' : 'Revisar',
            disabled: reviewed,
            dataset: { testid: 'review-flag' },
            onClick: () => {
              this.controller.reviewFlag(flag);
              this.go({ kind: 'audit' });
            },
          }),
        ),
      );
    }

    const checklistBox = el('div', { class: 'checklist' });
    if (auditDone) {
      const ul = el('ul');
      for (const entry of this.controller.getActiveLevelProgress().auditChecklist) {
        ul.append(el('li', { text: entry }));
      }
      checklistBox.append(el('h3', { text: 'Tu lista de auditoría' }), ul);
    } else {
      checklistBox.append(
        el('button', {
          class: 'btn',
          text: 'Generar lista de auditoría',
          dataset: { testid: 'generate-audit' },
          onClick: () => {
            this.controller.finalizeAudit();
            this.go({ kind: 'audit' });
          },
        }),
      );
    }

    const gate = this.controller.gate();
    const finishBlock: (HTMLElement | null)[] = [];
    if (!gate.ok) {
      finishBlock.push(
        el('p', {
          class: 'muted',
          text: `Pendiente: ${gate.missing.map(describeGateMissing).join(' · ')}`,
        }),
      );
    }
    finishBlock.push(
      el('button', {
        class: 'btn btn-primary',
        text: 'Finalizar nivel',
        disabled: !gate.ok,
        dataset: { testid: 'finish-level' },
        onClick: () => {
          const result = this.controller.completeLevel();
          if (result.ok && result.summary) {
            this.go({ kind: 'scorecard', summary: result.summary });
          } else {
            this.go({ kind: 'audit' });
          }
        },
      }),
    );

    return this.panel(
      'audit',
      [
        el('h2', { class: 'scenario-title', text: `Auditoría — ${pack.level.title}` }),
        el('p', {
          class: 'muted',
          text: 'Revisa las señales de alarma y produce tu lista de auditoría.',
        }),
        el(
          'div',
          { class: 'audit-head' },
          el('h3', { text: 'Señales de alarma a revisar' }),
          reviewAll,
        ),
        flagList,
        checklistBox,
        ...finishBlock,
      ],
      { testid: 'audit' },
    );
  }

  // ---- Scorecard --------------------------------------------------------

  private renderScorecard(summary: LevelScoreSummary): HTMLElement {
    const rows = el('div', { class: 'dimensions' });
    for (const dim of SCORE_DIMENSIONS) {
      // A dimension the player could not influence positively (best == 0) is
      // shown as "Sin impacto" rather than a rating they couldn't have earned.
      const noImpact = summary.best[dim] === 0;
      rows.append(
        el(
          'div',
          { class: 'dim-row' },
          el('span', { class: 'dim-name', text: DIMENSION_LABELS[dim] }),
          el('span', { class: 'dim-value', text: String(summary.score[dim]) }),
          el('span', {
            class: noImpact ? 'dim-rating rating-na' : `dim-rating rating-${summary.ratings[dim]}`,
            text: noImpact ? 'Sin impacto' : RATING_LABELS[summary.ratings[dim]],
          }),
        ),
      );
    }

    const cards = this.controller.getUnlockedCards();
    const activeLevel = this.controller.getActivePack().level;
    const nextPack = getNextAvailableLevel(activeLevel.id);

    return this.panel(
      'scorecard',
      [
        el('h2', { class: 'title', text: `Resultado — ${activeLevel.title}` }),
        el('p', {
          class: 'overall',
          text: `Valoración global: ${RATING_LABELS[summary.overallRating]}`,
        }),
        rows,
        el('p', { class: 'muted', text: `Cartas de aprendizaje desbloqueadas: ${cards.length}` }),
        nextPack
          ? el('button', {
              class: 'btn btn-primary',
              text: `Siguiente nivel: ${nextPack.level.title}`,
              dataset: { testid: 'next-level', levelId: nextPack.level.id },
              onClick: () => this.beginLevel(nextPack.level.id),
            })
          : null,
        el('button', {
          class: nextPack ? 'btn btn-ghost' : 'btn btn-primary',
          text: 'Volver al menú',
          dataset: { testid: 'back-to-menu' },
          onClick: () => this.go({ kind: 'menu' }),
        }),
        el('p', { class: 'disclaimer', text: DISCLAIMER }),
      ],
      { testid: 'scorecard' },
    );
  }

  // ---- Helpers ----------------------------------------------------------

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
