/**
 * Golden test for the Salón flooring module — snapshots the stable, player-
 * visible/safety-relevant shape so content or scoring drift is caught in review.
 */
import { describe, expect, it } from 'vitest';
import { getHouse, getProject, getRoom } from '../../game/systems/content';
import { bestPossibleScore } from '../../domain/scoring';

describe('Salón flooring module — golden', () => {
  it('the house exposes its rooms (ordered) and projects', () => {
    const house = getHouse();
    expect(house.rooms.map((r) => r.id)).toEqual(['salon', 'dormitorio']);
    expect(house.projects.map((p) => p.id).sort()).toEqual([
      'dormitorio-paint',
      'salon-flooring',
      'salon-lighting',
    ]);
  });

  it('the high-risk lighting module keeps its safety shape (critical + pro + notice)', () => {
    const p = getProject('salon-lighting')!;
    expect(p.prerequisites).toEqual(['salon-flooring']);
    expect(p.transform.agent).toBe('professional');
    expect({
      playerRole: p.playerRole,
      category: p.decide.category,
      riskLevel: p.decide.riskLevel,
      status: p.decide.status,
      transformAgent: p.transform.agent,
      trade: p.transform.professionalRouting?.trade,
      hasSafetyNotice:
        typeof p.decide.safetyNotice === 'string' && p.decide.safetyNotice.length > 0,
      recommended: p.decide.playerChoices.find((c) => c.recommended)?.id,
      redFlags: p.decide.redFlags,
      acceptanceChecks: p.decide.acceptanceChecks,
    }).toMatchSnapshot();
  });

  it('module shape (role, risk, transform attribution, flags, checks)', () => {
    const p = getProject('salon-flooring')!;
    expect({
      playerRole: p.playerRole,
      category: p.decide.category,
      riskLevel: p.decide.riskLevel,
      status: p.decide.status,
      transformAgent: p.transform.agent,
      trade: p.transform.professionalRouting?.trade,
      recommended: p.decide.playerChoices.find((c) => c.recommended)?.id,
      redFlags: p.decide.redFlags,
      acceptanceChecks: p.decide.acceptanceChecks,
    }).toMatchSnapshot();
  });

  it('the recommended pick is the best achievable score for the module', () => {
    const p = getProject('salon-flooring')!;
    const best = bestPossibleScore({
      level: { id: 'salon', order: 1, title: '', intro: '', available: true },
      items: [p.decide],
      cards: [],
    });
    expect(best).toMatchSnapshot();
  });

  it('each hotspot points at its project', () => {
    const room = getRoom('salon')!;
    expect(room.hotspots.map((h) => h.projectId)).toEqual(['salon-flooring', 'salon-lighting']);
  });
});
