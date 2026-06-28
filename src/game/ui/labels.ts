import type { GateMissing } from '../../domain/stage-gate';
import type { DimensionRating, ScoreDimension } from '../../domain/types';

/** Spanish player-facing labels for score dimensions and ratings. */
export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  safety: 'Seguridad',
  quality: 'Calidad',
  budget: 'Presupuesto',
  time: 'Tiempo',
  knowledge: 'Conocimiento',
  trust: 'Control',
};

export const RATING_LABELS: Record<DimensionRating, string> = {
  poor: 'Flojo',
  fair: 'Regular',
  good: 'Bien',
  excellent: 'Excelente',
};

export const DISCLAIMER =
  'Contenido educativo en borrador, pendiente de validación por un experto. No constituye asesoramiento legal, técnico ni profesional.';

/** Player-facing Spanish description of a pending completion requirement. */
export function describeGateMissing(m: GateMissing): string {
  switch (m.code) {
    case 'scenarios':
      return `Decide ${m.count} escenario(s) pendiente(s)`;
    case 'redflags':
      return `Revisa ${m.count} señal(es) de alarma pendiente(s)`;
    case 'checklist':
      return 'Genera la lista de auditoría del nivel';
  }
}
