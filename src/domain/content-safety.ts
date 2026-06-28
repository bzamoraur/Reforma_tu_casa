/**
 * Content-safety helpers (master prompt §9). These detect *instructional*
 * dangerous-DIY patterns and other forbidden framings in content text. They are
 * deliberately conservative and pattern-based — a tripwire, not a substitute for
 * the human expert review every technical item must still pass.
 *
 * This module is the SINGLE SOURCE OF TRUTH: it is imported by
 * scripts/content-lint.ts (the build gate) and by src/tests/content-safety.test.ts.
 * Do not duplicate these patterns elsewhere.
 *
 * Design note on negation: the patterns intentionally key on *imperative* DIY
 * verbs (instala/conecta/tumba…) and NOT on verbs typical of awareness framing
 * (toca/revisa/exige/llama/pide). We bias toward catching: a false positive is a
 * harmless prompt to rephrase, a false negative could ship dangerous content. We
 * deliberately avoid broad "skip if 'profesional' appears" guards because those
 * are trivially abused to smuggle DIY past the gate.
 */

import type { ContentCategory, RiskLevel } from './types';

export interface ForbiddenPattern {
  id: string;
  description: string;
  regex: RegExp;
}

export const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  {
    id: 'diy-electrical',
    description: 'Instrucción de bricolaje eléctrico peligroso',
    regex:
      /\b(instala|cambia|monta|conecta|empalma|cablea|manipula|sustituye|coloca)\b[^.]{0,60}\b(cuadro el[eé]ctric\w*|magnetot[eé]rmic\w*|diferencial\w*|l[ií]nea el[eé]ctric\w*|cableado|enchufes?|tomas? de corriente|220\s?v|230\s?v|\bfase\b|\bneutro\b)\b/i,
  },
  {
    id: 'bypass-protection',
    description: 'Puentear o anular protecciones eléctricas',
    regex:
      /\b(puente(a|ar|as)|anula|anular|anulas|desactiva|desactivar|salta(te)?)\b[^.]{0,60}\b(diferencial\w*|magnetot[eé]rmic\w*|contador|protecci[oó]n\w*|toma de tierra|fusible\w*)\b/i,
  },
  {
    id: 'gas-work',
    description: 'Manipulación de instalaciones de gas',
    regex:
      /\b(instala|conecta|modifica|manipula|monta|cambia|repara|empalma)\b[^.]{0,45}\b(gas|caldera|calentador|bombona|estufa de gas)\b/i,
  },
  {
    id: 'load-bearing',
    description: 'Demolición o modificación de elemento estructural',
    regex:
      /\b(tira|tirar|tumba|tumbar|quita|quitar|elimina|eliminar|abre|abrir|pica|picar|derriba|derribar|perfora|perforar)\b[^.]{0,60}\b(muro de carga|pared de carga|tabique de carga|pilar\w*|viga\w*|forjado|elemento estructural|estructura portante)\b/i,
  },
  {
    id: 'waterproofing-foolproof',
    description: 'Impermeabilización presentada como infalible',
    regex:
      /\bimpermeabiliza(ci[oó]n|r|s|do|da)?\b[^.]{0,60}\b(infalible|sin riesgo|a prueba de todo|garantizad[ao] al 100|nunca falla|para siempre)\b/i,
  },
  {
    id: 'avoid-licence',
    description: 'Consejo de evitar licencias o permisos',
    regex:
      /\b(evita|evitar|s[aá]ltate|saltarse|no pidas|no solicites|sin pedir|ah[oó]rrate|prescinde de)\b[^.]{0,40}\b(licencia\w*|permiso\w*|declaraci[oó]n responsable)/i,
  },
  {
    id: 'hide-from-authorities',
    description: 'Ocultar la obra a autoridades, comunidad o vecinos',
    regex:
      /\b(oculta|ocultar|esconde|esconder|que no se entere[n]?|no declares|sin que (lo )?sepa[n]?)\b[^.]{0,55}\b(ayuntamiento|inspecci[oó]n|comunidad|vecin[oa]s|autoridad\w*|administraci[oó]n)/i,
  },
  {
    id: 'diy-english',
    description: 'Dangerous DIY instruction (EN)',
    regex:
      /\b(rewire|wire (it|the outlet|the socket|the panel) yourself|bypass the (breaker|rcd|fuse|consumer unit)|do the (gas|electrical|wiring)( work)? yourself|diy (gas|electrical|wiring)|connect the gas yourself)\b/i,
  },
];

/** Return the forbidden patterns matched in a piece of text (possibly empty). */
export function scanForbidden(text: string): ForbiddenPattern[] {
  return FORBIDDEN_PATTERNS.filter((p) => p.regex.test(text));
}

/** Convenience: true if any forbidden pattern is present. */
export function hasForbiddenContent(text: string): boolean {
  return scanForbidden(text).length > 0;
}

// --- Risk-level discipline -------------------------------------------------

export const RISK_ORDER: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/** Risk levels that require a non-empty safetyNotice on a content item. */
export const HIGH_RISK_LEVELS: ReadonlySet<RiskLevel> = new Set<RiskLevel>(['high', 'critical']);

/**
 * Minimum declared riskLevel per category. Closes the "label dangerous content
 * as low to skip the safetyNotice gate" loophole. Anything in this map also
 * requires a safetyNotice regardless of the declared level.
 */
export const MIN_RISK_BY_CATEGORY: Partial<Record<ContentCategory, RiskLevel>> = {
  electricity_awareness: 'critical',
  plumbing_awareness: 'high',
  ventilation_awareness: 'high',
  structure_awareness: 'high',
  demolition: 'high',
};

export function minRiskForCategory(category: ContentCategory): RiskLevel | undefined {
  return MIN_RISK_BY_CATEGORY[category];
}

/** True if an item's declared riskLevel is below its category's required floor. */
export function riskBelowFloor(category: ContentCategory, riskLevel: RiskLevel): boolean {
  const min = MIN_RISK_BY_CATEGORY[category];
  if (!min) return false;
  return RISK_ORDER[riskLevel] < RISK_ORDER[min];
}

/** True if a category requires a safetyNotice (dangerous category) . */
export function categoryRequiresSafetyNotice(category: ContentCategory): boolean {
  return MIN_RISK_BY_CATEGORY[category] !== undefined;
}
