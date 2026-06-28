/**
 * Core domain types for Reforma Quest Madrid.
 *
 * These types are intentionally engine-agnostic (no Phaser / DOM dependencies)
 * so they can be unit-tested in isolation and reused if the rendering layer
 * ever changes. Content is data; the engine only renders and orchestrates it.
 *
 * Safety/commercial note: every technical content item carries a `status` and
 * `expertReview` block. Until a human expert validates an item, it must remain
 * `draft` or `pending_expert_review`. See docs/content-guidelines.md.
 */

export type ContentStatus =
  'draft' | 'pending_expert_review' | 'expert_verified' | 'source_verified' | 'rejected';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** The six scoring dimensions of the game. "trust" == contractor control. */
export type ScoreDimension = 'safety' | 'quality' | 'budget' | 'time' | 'knowledge' | 'trust';

export const SCORE_DIMENSIONS: readonly ScoreDimension[] = [
  'safety',
  'quality',
  'budget',
  'time',
  'knowledge',
  'trust',
] as const;

/** A full score vector. */
export type ScoreState = Record<ScoreDimension, number>;

/** A partial change to the score vector produced by a single choice. */
export type ScoreDelta = Partial<ScoreState>;

export type ContentCategory =
  | 'scope'
  | 'budget'
  | 'licence'
  | 'community'
  | 'demolition'
  | 'structure_awareness'
  | 'electricity_awareness'
  | 'plumbing_awareness'
  | 'ventilation_awareness'
  | 'flooring'
  | 'walls'
  | 'paint'
  | 'kitchen'
  | 'bathroom'
  | 'handover'
  | 'safety'
  | 'contracting';

export interface PlayerChoice {
  id: string;
  label: string;
  /** What happens if the player picks this. Shown immediately as feedback. */
  consequence: string;
  scoreDelta: ScoreDelta;
  /** Content (cards/items) unlocked by picking this choice. */
  unlocks?: string[];
  /** One-line practical lesson surfaced after the choice. */
  lesson?: string;
  /** The better question the player could have asked / should remember. */
  betterQuestion?: string;
  /** A red flag this choice exposes or ignores. */
  redFlag?: string;
  /** Optional source references backing the feedback for this choice. */
  sourceIds?: string[];
  /** Marks a strong answer. Used for feedback emphasis and golden tests. */
  recommended?: boolean;
}

export interface LegitimateWorkaround {
  title: string;
  whenUseful: string;
  constraints: string[];
  risks: string[];
  rejectWhen: string[];
  professionalRequired?: boolean;
}

export interface ExpertReview {
  required: boolean;
  status: 'not_requested' | 'requested' | 'approved' | 'changes_requested' | 'rejected';
  reviewerName?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ContentItem {
  id: string;
  levelId: string;
  title: string;
  category: ContentCategory;
  /**
   * Risk classification of the subject matter. Drives the content-lint rule
   * "every high-risk item must carry a safetyNotice". Extends the base schema
   * from the master prompt (which defines RiskLevel but left it unattached).
   */
  riskLevel: RiskLevel;
  learningObjective: string;
  scenarioText: string;
  playerChoices: PlayerChoice[];
  redFlags: string[];
  legitimateWorkarounds: LegitimateWorkaround[];
  acceptanceChecks: string[];
  safetyNotice?: string;
  sourceIds: string[];
  status: ContentStatus;
  expertReview: ExpertReview;
}

/** A concise, unlockable learning card ("expert tip"). */
export interface LearningCard {
  id: string;
  levelId: string;
  title: string;
  body: string;
  category: ContentCategory;
  sourceIds: string[];
  status: ContentStatus;
}

export interface LevelMeta {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  intro: string;
  /** false for not-yet-implemented levels (L2–L5 stubs in the MVP). */
  available: boolean;
}

/** A self-contained content file for one level. */
export interface LevelPack {
  level: LevelMeta;
  items: ContentItem[];
  cards: LearningCard[];
}

/** A single source-register entry. */
export interface SourceEntry {
  id: string;
  title: string;
  type: string;
  jurisdiction: string;
  citation: string;
  dateAccessed: string;
  summary: string;
  reliability: 'high' | 'medium' | 'low' | 'placeholder';
  contentAreas: string[];
  limitations: string;
}

export type DimensionRating = 'poor' | 'fair' | 'good' | 'excellent';
