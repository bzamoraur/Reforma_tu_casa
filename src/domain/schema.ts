/**
 * Runtime validation schemas (Zod) for all content data.
 *
 * These mirror the types in ./types.ts and are the single source of truth for
 * runtime validation. They are used both at game load time (fail fast on bad
 * content) and by the content-lint script (scripts/content-lint.ts).
 */

import { z } from 'zod';

export const contentStatusSchema = z.enum([
  'draft',
  'pending_expert_review',
  'expert_verified',
  'source_verified',
  'rejected',
]);

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const contentCategorySchema = z.enum([
  'scope',
  'budget',
  'licence',
  'community',
  'demolition',
  'structure_awareness',
  'electricity_awareness',
  'plumbing_awareness',
  'ventilation_awareness',
  'flooring',
  'walls',
  'paint',
  'kitchen',
  'bathroom',
  'handover',
  'safety',
  'contracting',
]);

export const scoreDeltaSchema = z
  .object({
    safety: z.number().optional(),
    quality: z.number().optional(),
    budget: z.number().optional(),
    time: z.number().optional(),
    knowledge: z.number().optional(),
    trust: z.number().optional(),
  })
  .strict();

export const playerChoiceSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    consequence: z.string().min(1),
    scoreDelta: scoreDeltaSchema,
    unlocks: z.array(z.string()).optional(),
    lesson: z.string().optional(),
    betterQuestion: z.string().optional(),
    redFlag: z.string().optional(),
    sourceIds: z.array(z.string()).optional(),
    recommended: z.boolean().optional(),
  })
  .strict();

export const legitimateWorkaroundSchema = z
  .object({
    title: z.string().min(1),
    whenUseful: z.string().min(1),
    constraints: z.array(z.string()).min(1),
    risks: z.array(z.string()).min(1),
    rejectWhen: z.array(z.string()).min(1),
    professionalRequired: z.boolean().optional(),
  })
  .strict();

export const expertReviewSchema = z
  .object({
    required: z.boolean(),
    status: z.enum(['not_requested', 'requested', 'approved', 'changes_requested', 'rejected']),
    reviewerName: z.string().optional(),
    reviewedAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

export const contentItemSchema = z
  .object({
    id: z.string().min(1),
    levelId: z.string().min(1),
    title: z.string().min(1),
    category: contentCategorySchema,
    riskLevel: riskLevelSchema,
    learningObjective: z.string().min(1),
    scenarioText: z.string().min(1),
    playerChoices: z.array(playerChoiceSchema).min(2),
    redFlags: z.array(z.string()),
    legitimateWorkarounds: z.array(legitimateWorkaroundSchema),
    acceptanceChecks: z.array(z.string()).min(1),
    safetyNotice: z.string().optional(),
    sourceIds: z.array(z.string()),
    status: contentStatusSchema,
    expertReview: expertReviewSchema,
  })
  .strict();

export const learningCardSchema = z
  .object({
    id: z.string().min(1),
    levelId: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    category: contentCategorySchema,
    sourceIds: z.array(z.string()),
    status: contentStatusSchema,
  })
  .strict();

export const levelMetaSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().positive(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    intro: z.string().min(1),
    available: z.boolean(),
  })
  .strict();

export const levelPackSchema = z
  .object({
    level: levelMetaSchema,
    items: z.array(contentItemSchema),
    cards: z.array(learningCardSchema),
  })
  .strict();

export const sourceEntrySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    type: z.string().min(1),
    jurisdiction: z.string().min(1),
    citation: z.string().min(1),
    dateAccessed: z.string().min(1),
    summary: z.string().min(1),
    reliability: z.enum(['high', 'medium', 'low', 'placeholder']),
    contentAreas: z.array(z.string()),
    limitations: z.string(),
  })
  .strict();

export const sourceRegisterSchema = z.object({
  sources: z.array(sourceEntrySchema),
});

export type LevelPackInput = z.input<typeof levelPackSchema>;
export type LevelPackParsed = z.output<typeof levelPackSchema>;
