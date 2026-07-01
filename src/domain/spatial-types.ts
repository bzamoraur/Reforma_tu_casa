/**
 * Spatial game model (ADR-0006): the room-by-room layer ABOVE the proven
 * ContentItem core. A House has Rooms; each Room has Hotspots that start
 * Projects; a Project is a learning MODULE (learn → decide → transform) that,
 * when mastered, flips the room's visual state. The 'decide' beat reuses the
 * existing ContentItem verbatim, so scoring, red flags, acceptance checks and
 * the content-safety gate keep working unchanged.
 *
 * SAFETY INVARIANT: PlayerRole has NO execution value for regulated trades, so
 * "the player personally does dangerous work" is unrepresentable in content.
 */
import type { ContentItem } from './types';

export type PlayerRole =
  'decide' | 'choose_design' | 'supervise' | 'inspect' | 'audit' | 'document' | 'simple_safe_diy';

export const PLAYER_ROLES: readonly PlayerRole[] = [
  'decide',
  'choose_design',
  'supervise',
  'inspect',
  'audit',
  'document',
  'simple_safe_diy',
] as const;

export type RoomVisualState = 'untouched' | 'in_progress' | 'renovated';
export type TransformAgent = 'professional' | 'player_safe_diy';

export interface Hotspot {
  id: string;
  label: string;
  discoverHint: string;
  projectId: string;
  /** Position on the room art as 0..1 fractions, for overlaying a DOM hotspot. */
  x: number;
  y: number;
}

export interface RoomArt {
  /** Asset ids registered in src/content/assets/assets-register.json. */
  before: string;
  after: string;
}

export interface Room {
  id: string;
  name: string;
  order: number;
  intro: string;
  art: RoomArt;
  hotspots: Hotspot[];
  projectIds: string[];
}

export interface LearnStep {
  title: string;
  body: string;
  sourceIds: string[];
}

export interface ProfessionalRouting {
  trade: string;
  note: string;
}

export interface ProjectTransform {
  caption: string;
  agent: TransformAgent;
  professionalRouting?: ProfessionalRouting;
}

/** A renovation MODULE attached to a room: learn → decide → transform. */
export interface Project {
  id: string;
  roomId: string;
  title: string;
  opportunity: string;
  playerRole: PlayerRole;
  learn: LearnStep;
  /** The mastery check. Reused ContentItem: scoring/redflags/safety/sources. */
  decide: ContentItem;
  transform: ProjectTransform;
  /**
   * Per-project before/after art, used by the transform screen. Lets one room
   * host several modules that each show their own change (e.g. Salón floor vs.
   * lighting). Falls back to the room's art when omitted.
   */
  art?: RoomArt;
  prerequisites: string[];
}

export interface HousePack {
  house: { id: string; name: string };
  rooms: Room[];
  projects: Project[];
}
