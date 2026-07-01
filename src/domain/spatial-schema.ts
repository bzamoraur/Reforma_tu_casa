/**
 * Runtime validation (Zod) for the spatial game model (ADR-0006). Mirrors
 * spatial-types.ts. Reuses contentItemSchema for the 'decide' beat so the
 * module's decision content is validated exactly like a level item. Used at
 * load time (src/game/systems/content.ts) and by the content-lint script.
 */
import { z } from 'zod';
import { contentItemSchema } from './schema';

export const playerRoleSchema = z.enum([
  'decide',
  'choose_design',
  'supervise',
  'inspect',
  'audit',
  'document',
  'simple_safe_diy',
]);

export const transformAgentSchema = z.enum(['professional', 'player_safe_diy']);

export const hotspotSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    discoverHint: z.string().min(1),
    projectId: z.string().min(1),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

export const roomArtSchema = z
  .object({
    before: z.string().min(1),
    after: z.string().min(1),
  })
  .strict();

export const roomSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    order: z.number().int().positive(),
    intro: z.string().min(1),
    art: roomArtSchema,
    hotspots: z.array(hotspotSchema),
    projectIds: z.array(z.string()).min(1),
  })
  .strict();

export const learnStepSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
    sourceIds: z.array(z.string()),
  })
  .strict();

export const professionalRoutingSchema = z
  .object({
    trade: z.string().min(1),
    note: z.string().min(1),
  })
  .strict();

export const projectTransformSchema = z
  .object({
    caption: z.string().min(1),
    agent: transformAgentSchema,
    professionalRouting: professionalRoutingSchema.optional(),
  })
  .strict();

export const projectSchema = z
  .object({
    id: z.string().min(1),
    roomId: z.string().min(1),
    title: z.string().min(1),
    opportunity: z.string().min(1),
    playerRole: playerRoleSchema,
    learn: learnStepSchema,
    decide: contentItemSchema,
    transform: projectTransformSchema,
    art: roomArtSchema.optional(),
    prerequisites: z.array(z.string()),
  })
  .strict();

export const housePackSchema = z
  .object({
    house: z.object({ id: z.string().min(1), name: z.string().min(1) }).strict(),
    rooms: z.array(roomSchema).min(1),
    projects: z.array(projectSchema).min(1),
  })
  .strict();

export type HousePackInput = z.input<typeof housePackSchema>;
export type HousePackParsed = z.output<typeof housePackSchema>;
