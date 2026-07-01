import { describe, expect, it } from 'vitest';
import { hasForbiddenContent, transformMustBeProfessional } from '../domain/content-safety';

/**
 * Safety guardrails specific to the spatial-module surface (ADR-0006). The new
 * interactive strings (learn briefs, option labels, transform captions) must be
 * scanned exactly like level items, and risky modules must attribute the work
 * to a professional — never to the player's own hands.
 */
describe('spatial-module safety', () => {
  it('forces professional attribution for risky modules', () => {
    // dangerous category (regardless of declared low risk)
    expect(transformMustBeProfessional('electricity_awareness', 'low')).toBe(true);
    expect(transformMustBeProfessional('plumbing_awareness', 'low')).toBe(true);
    // high/critical risk
    expect(transformMustBeProfessional('flooring', 'high')).toBe(true);
    // genuinely low-risk, non-dangerous category may be player_safe_diy
    expect(transformMustBeProfessional('flooring', 'low')).toBe(false);
    expect(transformMustBeProfessional('paint', 'low')).toBe(false);
  });

  it('MUST PASS: deciding / choosing / supervising framing is allowed', () => {
    expect(
      hasForbiddenContent('Elige dónde quieres los puntos de luz y díselo al electricista'),
    ).toBe(false);
    expect(
      hasForbiddenContent('Comprueba que el soporte está nivelado antes de instalar el suelo'),
    ).toBe(false);
    expect(hasForbiddenContent('Supervisa que el instalador deje el suelo bien asentado')).toBe(
      false,
    );
  });

  it('MUST CATCH: execution of regulated work is forbidden anywhere', () => {
    expect(
      hasForbiddenContent('Instala tú el cuadro eléctrico para ahorrarte al electricista'),
    ).toBe(true);
    expect(hasForbiddenContent('Conecta el gas tú mismo, es fácil')).toBe(true);
    expect(hasForbiddenContent('Puentea el diferencial si salta')).toBe(true);
  });
});
