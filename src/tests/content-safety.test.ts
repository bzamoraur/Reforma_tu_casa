import { describe, expect, it } from 'vitest';
import {
  HIGH_RISK_LEVELS,
  categoryRequiresSafetyNotice,
  hasForbiddenContent,
  minRiskForCategory,
  riskBelowFloor,
  scanForbidden,
} from '../domain/content-safety';
import { getLevelPack } from '../game/systems/content';
import type { ContentItem } from '../domain/types';

// Each must be caught, and must be caught by the expected pattern id.
const MUST_CATCH: { text: string; id: string }[] = [
  { text: 'Instala tú mismo el cuadro eléctrico', id: 'diy-electrical' },
  { text: 'Conecta los cables de 220V directamente sin cortar la luz', id: 'diy-electrical' },
  { text: 'Empalma el cable de fase con el neutro', id: 'diy-electrical' },
  { text: 'Puentea el diferencial para que no salte', id: 'bypass-protection' },
  { text: 'Anula el magnetotérmico del cuadro', id: 'bypass-protection' },
  { text: 'Manipula la llave de gas tú mismo', id: 'gas-work' },
  { text: 'Conecta la caldera de gas', id: 'gas-work' },
  { text: 'Tira el tabique de carga del salón', id: 'load-bearing' },
  { text: 'Quita el muro de carga', id: 'load-bearing' },
  { text: 'Evita la licencia de obra', id: 'avoid-licence' },
  { text: 'No pidas permiso al ayuntamiento antes de empezar', id: 'avoid-licence' },
  { text: 'Oculta la obra a la comunidad de vecinos', id: 'hide-from-authorities' },
  { text: 'You can rewire the kitchen yourself', id: 'diy-english' },
  { text: 'Just bypass the breaker and move on', id: 'diy-english' },
];

// Awareness / red-flag framing that MUST pass (no false positives).
const MUST_PASS = [
  'No toques el cuadro eléctrico; llama a un profesional autorizado',
  'Exige un instalador de gas autorizado y su certificado',
  'Pide siempre la licencia de obra por escrito',
  'Un muro de carga solo lo toca un profesional con proyecto',
  'Conviene revisar la instalación eléctrica con un técnico cualificado',
  'Solicita la licencia o declaración responsable correspondiente',
  'Documenta con fotos cada partida del presupuesto',
];

describe('forbidden-pattern scanner', () => {
  it.each(MUST_CATCH)('catches dangerous DIY: "$text" → $id', ({ text, id }) => {
    const matched = scanForbidden(text).map((p) => p.id);
    expect(matched, `expected ${id} to match "${text}"`).toContain(id);
    expect(hasForbiddenContent(text)).toBe(true);
  });

  it.each(MUST_PASS)('does not flag awareness wording: "%s"', (text) => {
    expect(scanForbidden(text), `false positive on "${text}"`).toEqual([]);
    expect(hasForbiddenContent(text)).toBe(false);
  });
});

describe('risk-level discipline', () => {
  it('flags declared risk below the category floor', () => {
    expect(riskBelowFloor('electricity_awareness', 'low')).toBe(true);
    expect(riskBelowFloor('electricity_awareness', 'high')).toBe(true); // floor is critical
    expect(riskBelowFloor('electricity_awareness', 'critical')).toBe(false);
    expect(riskBelowFloor('demolition', 'medium')).toBe(true);
    expect(riskBelowFloor('demolition', 'high')).toBe(false);
  });

  it('has no floor for low-risk categories', () => {
    expect(riskBelowFloor('contracting', 'low')).toBe(false);
    expect(riskBelowFloor('paint', 'low')).toBe(false);
    expect(minRiskForCategory('contracting')).toBeUndefined();
  });

  it('requires safetyNotice for dangerous categories and high/critical levels', () => {
    expect(categoryRequiresSafetyNotice('electricity_awareness')).toBe(true);
    expect(categoryRequiresSafetyNotice('plumbing_awareness')).toBe(true);
    expect(categoryRequiresSafetyNotice('paint')).toBe(false);
    expect(HIGH_RISK_LEVELS.has('high')).toBe(true);
    expect(HIGH_RISK_LEVELS.has('critical')).toBe(true);
    expect(HIGH_RISK_LEVELS.has('low')).toBe(false);
    expect(HIGH_RISK_LEVELS.has('medium')).toBe(false);
  });
});

describe('shipped Level 1 content is clean', () => {
  function collect(item: ContentItem): string {
    const parts = [
      item.title,
      item.learningObjective,
      item.scenarioText,
      ...item.redFlags,
      ...item.acceptanceChecks,
    ];
    for (const c of item.playerChoices) {
      parts.push(c.label, c.consequence, c.lesson ?? '', c.betterQuestion ?? '', c.redFlag ?? '');
    }
    for (const w of item.legitimateWorkarounds) {
      parts.push(w.title, w.whenUseful, ...w.constraints, ...w.risks, ...w.rejectWhen);
    }
    return parts.join('\n');
  }

  it('contains no forbidden DIY patterns', () => {
    const pack = getLevelPack('level-1');
    for (const item of pack?.items ?? []) {
      expect(scanForbidden(collect(item)), `forbidden content in ${item.id}`).toEqual([]);
    }
    for (const card of pack?.cards ?? []) {
      expect(
        scanForbidden(`${card.title}\n${card.body}`),
        `forbidden content in ${card.id}`,
      ).toEqual([]);
    }
  });
});
