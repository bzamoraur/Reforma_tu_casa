/**
 * Content registry for the game runtime.
 *
 * Imports the versioned JSON content files and validates them with the Zod
 * schemas at load time, so malformed content fails fast and loudly rather than
 * corrupting gameplay. The same schemas are reused by scripts/content-lint.ts.
 */

import { levelPackSchema, sourceRegisterSchema } from '../../domain/schema';
import { housePackSchema } from '../../domain/spatial-schema';
import type { LearningCard, LevelPack, SourceEntry } from '../../domain/types';
import type { HousePack, Project, Room } from '../../domain/spatial-types';

import level1 from '../../content/levels/level-1.json';
import level2 from '../../content/levels/level-2.json';
import level3 from '../../content/levels/level-3.json';
import level4 from '../../content/levels/level-4.json';
import level5 from '../../content/levels/level-5.json';
import salonHouse from '../../content/rooms/salon.json';
import dormitorioHouse from '../../content/rooms/dormitorio.json';
import sourceRegister from '../../content/sources/source-register.json';

const rawLevels = [level1, level2, level3, level4, level5];

function parseLevels(): LevelPack[] {
  return rawLevels.map((raw, i) => {
    const result = levelPackSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(
        `Invalid level content at index ${i}: ${JSON.stringify(result.error.issues, null, 2)}`,
      );
    }
    return result.data as LevelPack;
  });
}

function parseSources(): SourceEntry[] {
  const result = sourceRegisterSchema.safeParse(sourceRegister);
  if (!result.success) {
    throw new Error(`Invalid source register: ${JSON.stringify(result.error.issues, null, 2)}`);
  }
  return result.data.sources as SourceEntry[];
}

const LEVELS: LevelPack[] = parseLevels().sort((a, b) => a.level.order - b.level.order);
const SOURCES: SourceEntry[] = parseSources();

const CARD_INDEX = new Map<string, LearningCard>();
for (const pack of LEVELS) {
  for (const card of pack.cards) {
    CARD_INDEX.set(card.id, card);
  }
}

export function getAllLevels(): LevelPack[] {
  return LEVELS;
}

export function getAvailableLevels(): LevelPack[] {
  return LEVELS.filter((p) => p.level.available);
}

export function getLevelPack(levelId: string): LevelPack | undefined {
  return LEVELS.find((p) => p.level.id === levelId);
}

/**
 * The next available level after the given one (by play order), or undefined if
 * the given level is the last available one. Drives "next level" progression.
 */
export function getNextAvailableLevel(levelId: string): LevelPack | undefined {
  const available = getAvailableLevels();
  const idx = available.findIndex((p) => p.level.id === levelId);
  if (idx < 0) return undefined;
  return available[idx + 1];
}

export function getCard(cardId: string): LearningCard | undefined {
  return CARD_INDEX.get(cardId);
}

export function getAllSources(): SourceEntry[] {
  return SOURCES;
}

export function getSource(sourceId: string): SourceEntry | undefined {
  return SOURCES.find((s) => s.id === sourceId);
}

// --- Spatial game (ADR-0006): rooms & renovation modules -------------------

const rawHousePacks = [salonHouse, dormitorioHouse];

function parseHousePacks(): HousePack[] {
  return rawHousePacks.map((raw, i) => {
    const result = housePackSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(
        `Invalid house pack at index ${i}: ${JSON.stringify(result.error.issues, null, 2)}`,
      );
    }
    return result.data as unknown as HousePack;
  });
}

const HOUSE_PACKS: HousePack[] = parseHousePacks();
const ROOMS: Room[] = HOUSE_PACKS.flatMap((p) => p.rooms).sort((a, b) => a.order - b.order);
const PROJECT_INDEX = new Map<string, Project>();
for (const pack of HOUSE_PACKS) {
  for (const project of pack.projects) PROJECT_INDEX.set(project.id, project);
}

/** The (single, for now) house: all rooms + projects merged. */
export function getHouse(): HousePack {
  return { house: HOUSE_PACKS[0].house, rooms: ROOMS, projects: [...PROJECT_INDEX.values()] };
}

export function getRooms(): Room[] {
  return ROOMS;
}

export function getRoom(roomId: string): Room | undefined {
  return ROOMS.find((r) => r.id === roomId);
}

export function getProject(projectId: string): Project | undefined {
  return PROJECT_INDEX.get(projectId);
}
