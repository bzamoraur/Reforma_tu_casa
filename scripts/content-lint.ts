/**
 * Content quality gate. Run with: npm run content:lint
 *
 * Validates every level pack, house pack (rooms/modules) and the source
 * register against the Zod schemas, then applies safety/integrity rules that
 * schemas alone cannot express:
 *   1. Schema validity.
 *   2. Referential integrity of all sourceIds / room / project / hotspot refs.
 *   3. High/critical-risk (or dangerous-category) items must carry a safetyNotice.
 *   4. Category -> minimum riskLevel floor (closes the "mislabel as low" loophole).
 *   5. Workarounds must be framed with constraints, risks and rejectWhen.
 *   6. status expert_verified / source_verified requires complete metadata.
 *   7. No dangerous DIY instructions (forbidden-pattern scan over ALL text fields,
 *      including every spatial-module string: learn, opportunity, hotspots, captions).
 *   8. Every item and card must reference at least one source.
 *   9. Normative-risk categories must not rely solely on placeholder sources (warn).
 *  10. A risky module's visible transform must be attributed to a professional.
 *
 * The forbidden-pattern list and risk rules live in src/domain/content-safety.ts
 * (single source of truth, unit-tested). Exit code 1 on any ERROR (WARN does not fail).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelPackSchema, sourceRegisterSchema } from '../src/domain/schema';
import { housePackSchema } from '../src/domain/spatial-schema';
import type { ContentItem, LevelPack, SourceEntry } from '../src/domain/types';
import type { HousePack, Project } from '../src/domain/spatial-types';
import {
  HIGH_RISK_LEVELS,
  categoryRequiresSafetyNotice,
  minRiskForCategory,
  riskBelowFloor,
  scanForbidden,
  transformMustBeProfessional,
} from '../src/domain/content-safety';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const levelsDir = path.join(repoRoot, 'src', 'content', 'levels');
const roomsDir = path.join(repoRoot, 'src', 'content', 'rooms');
const sourcesFile = path.join(repoRoot, 'src', 'content', 'sources', 'source-register.json');

type Severity = 'error' | 'warn';
interface Issue {
  file: string;
  severity: Severity;
  where: string;
  message: string;
  fix: string;
}

const issues: Issue[] = [];
function err(file: string, where: string, message: string, fix: string): void {
  issues.push({ file, severity: 'error', where, message, fix });
}
function warn(file: string, where: string, message: string, fix: string): void {
  issues.push({ file, severity: 'warn', where, message, fix });
}

const FIX_FORBIDDEN =
  'Reformula como pregunta/inspección o exige un profesional. Nunca des pasos de ejecución peligrosa.';

/** Concatenate every player-facing text field of an item so none is exempt. */
function collectItemText(item: ContentItem): string {
  const parts: string[] = [
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

/** Every player-facing string a renovation MODULE adds beyond its decide item. */
function collectModuleText(project: Project): string {
  const parts: string[] = [
    project.title,
    project.opportunity,
    project.learn.title,
    project.learn.body,
    project.transform.caption,
  ];
  if (project.transform.professionalRouting) {
    parts.push(
      project.transform.professionalRouting.trade,
      project.transform.professionalRouting.note,
    );
  }
  return parts.join('\n');
}

const PRICE_RE = /(\d[\d.,]*\s*(€|euros?)|\b\d{1,3}\s*%)/i;

// --- Load source register --------------------------------------------------

let sourceIds = new Set<string>();
let sources: SourceEntry[] = [];
const reliabilityById = new Map<string, SourceEntry['reliability']>();
try {
  const raw: unknown = JSON.parse(readFileSync(sourcesFile, 'utf8'));
  const parsed = sourceRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    err(
      'source-register.json',
      'schema',
      'El registro de fuentes no valida contra el esquema.',
      JSON.stringify(parsed.error.issues),
    );
  } else {
    sources = parsed.data.sources as SourceEntry[];
    sourceIds = new Set(sources.map((s) => s.id));
    const seen = new Set<string>();
    for (const s of sources) {
      if (seen.has(s.id))
        err('source-register.json', s.id, 'ID de fuente duplicado.', 'Usa ids únicos.');
      seen.add(s.id);
      reliabilityById.set(s.id, s.reliability);
    }
  }
} catch (e) {
  err(
    'source-register.json',
    'read',
    `No se pudo leer el registro de fuentes: ${String(e)}`,
    'Crea src/content/sources/source-register.json.',
  );
}

function allPlaceholder(ids: string[]): boolean {
  return ids.length > 0 && ids.every((id) => reliabilityById.get(id) === 'placeholder');
}

function checkSources(file: string, where: string, ids: string[]): void {
  for (const id of ids) {
    if (!sourceIds.has(id)) {
      err(
        file,
        where,
        `sourceId desconocido: "${id}"`,
        'Añade la fuente al registro o corrige el id.',
      );
    }
  }
}

/**
 * All safety/integrity checks for a ContentItem. Shared by level items and by a
 * module's 'decide' beat so the SAME rules apply everywhere (no duplication).
 */
function lintContentItem(file: string, item: ContentItem, at: string): void {
  if (item.sourceIds.length === 0) {
    err(file, at, 'El item no referencia ninguna fuente.', 'Añade al menos un sourceId.');
  }
  checkSources(file, at, item.sourceIds);

  if (riskBelowFloor(item.category, item.riskLevel)) {
    err(
      file,
      at,
      `Categoría "${item.category}" exige riskLevel >= "${minRiskForCategory(item.category)}" (declarado "${item.riskLevel}").`,
      'Sube el riskLevel declarado o cambia la categoría.',
    );
  }

  if (
    (HIGH_RISK_LEVELS.has(item.riskLevel) || categoryRequiresSafetyNotice(item.category)) &&
    !item.safetyNotice
  ) {
    err(
      file,
      at,
      `Item de riesgo/categoría peligrosa sin safetyNotice (riskLevel="${item.riskLevel}", categoría="${item.category}").`,
      'Añade un campo safetyNotice claro.',
    );
  }

  if (item.status === 'expert_verified') {
    const r = item.expertReview;
    if (r.status !== 'approved' || !r.reviewerName || !r.reviewedAt) {
      err(
        file,
        at,
        'status "expert_verified" sin metadatos de revisión completos.',
        'Requiere expertReview.status="approved", reviewerName y reviewedAt.',
      );
    }
  }
  if (item.status === 'source_verified' && allPlaceholder(item.sourceIds)) {
    err(
      file,
      at,
      'status "source_verified" pero todas las fuentes son placeholder.',
      'Sustituye los placeholders por fuentes reales antes de marcar source_verified.',
    );
  }

  for (const w of item.legitimateWorkarounds) {
    const wat = `${at}/workaround:${w.title}`;
    if (w.constraints.length === 0)
      err(file, wat, 'Workaround sin constraints.', 'Añade al menos una restricción.');
    if (w.rejectWhen.length === 0)
      err(file, wat, 'Workaround sin rejectWhen.', 'Indica cuándo rechazarlo.');
    if (w.risks.length === 0) err(file, wat, 'Workaround sin risks.', 'Indica sus riesgos.');
  }

  for (const pattern of scanForbidden(collectItemText(item))) {
    err(
      file,
      at,
      `Posible bricolaje peligroso: ${pattern.description} [${pattern.id}]`,
      FIX_FORBIDDEN,
    );
  }

  if (
    (item.category === 'licence' || item.category === 'community') &&
    allPlaceholder(item.sourceIds)
  ) {
    warn(
      file,
      at,
      'Item normativo (licence/community) respaldado solo por fuentes placeholder.',
      'Añade una fuente real (no placeholder) antes de validar.',
    );
  }

  if (PRICE_RE.test(item.scenarioText)) {
    warn(
      file,
      at,
      'Cifra monetaria o porcentaje en el escenario.',
      'Confirma que es ficción del juego, no una afirmación de precio real.',
    );
  }

  if (item.expertReview.required === false) {
    warn(
      file,
      at,
      'expertReview.required = false en contenido técnico.',
      'Confirma que realmente no necesita revisión experta.',
    );
  }
}

// --- Validate each level pack ---------------------------------------------

let itemCount = 0;
let cardCount = 0;

const levelFiles = readdirSync(levelsDir).filter((f) => f.endsWith('.json'));
for (const fileName of levelFiles) {
  const filePath = path.join(levelsDir, fileName);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(fileName, 'read', `JSON inválido: ${String(e)}`, 'Corrige la sintaxis JSON.');
    continue;
  }

  const parsed = levelPackSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      err(
        fileName,
        issue.path.join('.') || 'root',
        issue.message,
        'Ajusta el contenido al esquema (src/domain/schema.ts).',
      );
    }
    continue;
  }

  const pack = parsed.data as LevelPack;
  for (const item of pack.items) {
    itemCount += 1;
    lintContentItem(fileName, item, `item:${item.id}`);
  }

  for (const card of pack.cards) {
    cardCount += 1;
    const at = `card:${card.id}`;
    if (card.sourceIds.length === 0) {
      err(fileName, at, 'La carta no referencia ninguna fuente.', 'Añade al menos un sourceId.');
    }
    checkSources(fileName, at, card.sourceIds);
    for (const pattern of scanForbidden(`${card.title}\n${card.body}`)) {
      err(
        fileName,
        at,
        `Posible bricolaje peligroso: ${pattern.description} [${pattern.id}]`,
        FIX_FORBIDDEN,
      );
    }
    if (card.status === 'expert_verified' || card.status === 'source_verified') {
      err(
        fileName,
        at,
        `Una carta no puede marcarse ${card.status} en el MVP (sin metadatos de validación).`,
        'Mantén draft/pending_expert_review hasta la validación.',
      );
    }
  }
}

// --- Validate each house pack (rooms / modules) ---------------------------

let roomCount = 0;
let projectCount = 0;

const roomFiles = existsSync(roomsDir)
  ? readdirSync(roomsDir).filter((f) => f.endsWith('.json'))
  : [];
for (const fileName of roomFiles) {
  const filePath = path.join(roomsDir, fileName);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    err(fileName, 'read', `JSON inválido: ${String(e)}`, 'Corrige la sintaxis JSON.');
    continue;
  }

  const parsed = housePackSchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      err(
        fileName,
        issue.path.join('.') || 'root',
        issue.message,
        'Ajusta el contenido al esquema (src/domain/spatial-schema.ts).',
      );
    }
    continue;
  }

  const pack = parsed.data as unknown as HousePack;
  const projectIds = new Set(pack.projects.map((p) => p.id));
  const roomIds = new Set(pack.rooms.map((r) => r.id));

  for (const room of pack.rooms) {
    roomCount += 1;
    const rat = `room:${room.id}`;
    for (const pid of room.projectIds) {
      if (!projectIds.has(pid))
        err(
          fileName,
          rat,
          `projectId desconocido en la estancia: "${pid}"`,
          'Define el proyecto o corrige el id.',
        );
    }
    for (const hs of room.hotspots) {
      const hat = `${rat}/hotspot:${hs.id}`;
      if (!projectIds.has(hs.projectId))
        err(
          fileName,
          hat,
          `hotspot.projectId desconocido: "${hs.projectId}"`,
          'Apunta a un proyecto existente.',
        );
      for (const p of scanForbidden(`${hs.label}\n${hs.discoverHint}`))
        err(
          fileName,
          hat,
          `Posible bricolaje peligroso: ${p.description} [${p.id}]`,
          FIX_FORBIDDEN,
        );
    }
    for (const p of scanForbidden(room.intro))
      err(fileName, rat, `Posible bricolaje peligroso: ${p.description} [${p.id}]`, FIX_FORBIDDEN);
  }

  for (const project of pack.projects) {
    projectCount += 1;
    const pat = `project:${project.id}`;
    if (!roomIds.has(project.roomId))
      err(
        fileName,
        pat,
        `roomId desconocido: "${project.roomId}"`,
        'Apunta a una estancia existente.',
      );
    for (const pre of project.prerequisites) {
      if (!projectIds.has(pre))
        err(fileName, pat, `prerequisite desconocido: "${pre}"`, 'Apunta a un proyecto existente.');
    }

    if (project.learn.sourceIds.length === 0)
      err(
        fileName,
        `${pat}/learn`,
        'El paso learn no referencia ninguna fuente.',
        'Añade al menos un sourceId.',
      );
    checkSources(fileName, `${pat}/learn`, project.learn.sourceIds);

    for (const p of scanForbidden(collectModuleText(project)))
      err(fileName, pat, `Posible bricolaje peligroso: ${p.description} [${p.id}]`, FIX_FORBIDDEN);

    const dec = project.decide;
    if (
      transformMustBeProfessional(dec.category, dec.riskLevel) &&
      project.transform.agent !== 'professional'
    ) {
      err(
        fileName,
        pat,
        `Módulo de riesgo (categoría="${dec.category}", riskLevel="${dec.riskLevel}") con transform.agent="${project.transform.agent}".`,
        'El resultado de la obra debe atribuirse a un profesional: transform.agent="professional".',
      );
    }

    // The decide beat is a full ContentItem — run the exact item checks on it.
    lintContentItem(fileName, dec, `${pat}/decide`);
  }
}

// --- Report ----------------------------------------------------------------

const errors = issues.filter((i) => i.severity === 'error');
const warns = issues.filter((i) => i.severity === 'warn');

console.log('\n=== Content lint =========================================');
console.log(
  `Files: ${levelFiles.length} level pack(s), ${roomFiles.length} house pack(s), ${sources.length} source(s)`,
);
console.log(
  `Scanned: ${itemCount} item(s), ${cardCount} card(s), ${roomCount} room(s), ${projectCount} project(s)`,
);

if (issues.length === 0) {
  console.log('\n✅ No issues found.\n');
  process.exit(0);
}

const byFile = new Map<string, Issue[]>();
for (const issue of issues) {
  const list = byFile.get(issue.file) ?? [];
  list.push(issue);
  byFile.set(issue.file, list);
}
for (const [file, list] of byFile) {
  console.log(`\n${file}`);
  for (const i of list) {
    const tag = i.severity === 'error' ? 'ERROR' : 'WARN ';
    console.log(`  [${tag}] ${i.where}: ${i.message}`);
    console.log(`          → ${i.fix}`);
  }
}

console.log(`\n${errors.length} error(s), ${warns.length} warning(s).\n`);
process.exit(errors.length > 0 ? 1 : 0);
