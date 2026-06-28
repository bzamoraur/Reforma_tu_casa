/**
 * Content quality gate. Run with: npm run content:lint
 *
 * Validates every level pack and the source register against the Zod schemas,
 * then applies safety/integrity rules that schemas alone cannot express:
 *   1. Schema validity.
 *   2. Referential integrity of all sourceIds (must exist in the register).
 *   3. High/critical-risk (or dangerous-category) items must carry a safetyNotice.
 *   4. Category -> minimum riskLevel floor (closes the "mislabel as low" loophole).
 *   5. Workarounds must be framed with constraints, risks and rejectWhen.
 *   6. status expert_verified / source_verified requires complete metadata.
 *   7. No dangerous DIY instructions (forbidden-pattern scan over ALL text fields).
 *   8. Every item and card must reference at least one source.
 *   9. Normative-risk categories must not rely solely on placeholder sources (warn).
 *
 * The forbidden-pattern list and risk rules live in src/domain/content-safety.ts
 * (single source of truth, unit-tested). Exit code 1 on any ERROR (WARN does not fail).
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { levelPackSchema, sourceRegisterSchema } from '../src/domain/schema';
import type { ContentItem, LevelPack, SourceEntry } from '../src/domain/types';
import {
  HIGH_RISK_LEVELS,
  categoryRequiresSafetyNotice,
  minRiskForCategory,
  riskBelowFloor,
  scanForbidden,
} from '../src/domain/content-safety';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const levelsDir = path.join(repoRoot, 'src', 'content', 'levels');
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

// --- Validate each level pack ---------------------------------------------

const levelFiles = readdirSync(levelsDir).filter((f) => f.endsWith('.json'));
let itemCount = 0;
let cardCount = 0;

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
  const checkSources = (where: string, ids: string[]) => {
    for (const id of ids) {
      if (!sourceIds.has(id)) {
        err(
          fileName,
          where,
          `sourceId desconocido: "${id}"`,
          'Añade la fuente al registro o corrige el id.',
        );
      }
    }
  };

  for (const item of pack.items) {
    itemCount += 1;
    const at = `item:${item.id}`;

    if (item.sourceIds.length === 0) {
      err(fileName, at, 'El item no referencia ninguna fuente.', 'Añade al menos un sourceId.');
    }
    checkSources(at, item.sourceIds);

    // Category -> minimum riskLevel floor (closes the mislabel loophole).
    if (riskBelowFloor(item.category, item.riskLevel)) {
      err(
        fileName,
        at,
        `Categoría "${item.category}" exige riskLevel >= "${minRiskForCategory(item.category)}" (declarado "${item.riskLevel}").`,
        'Sube el riskLevel declarado o cambia la categoría.',
      );
    }

    // safetyNotice required for high/critical OR dangerous categories.
    if (
      (HIGH_RISK_LEVELS.has(item.riskLevel) || categoryRequiresSafetyNotice(item.category)) &&
      !item.safetyNotice
    ) {
      err(
        fileName,
        at,
        `Item de riesgo/categoría peligrosa sin safetyNotice (riskLevel="${item.riskLevel}", categoría="${item.category}").`,
        'Añade un campo safetyNotice claro.',
      );
    }

    // Verified statuses require metadata.
    if (item.status === 'expert_verified') {
      const r = item.expertReview;
      if (r.status !== 'approved' || !r.reviewerName || !r.reviewedAt) {
        err(
          fileName,
          at,
          'status "expert_verified" sin metadatos de revisión completos.',
          'Requiere expertReview.status="approved", reviewerName y reviewedAt.',
        );
      }
    }
    if (item.status === 'source_verified' && allPlaceholder(item.sourceIds)) {
      err(
        fileName,
        at,
        'status "source_verified" pero todas las fuentes son placeholder.',
        'Sustituye los placeholders por fuentes reales antes de marcar source_verified.',
      );
    }

    for (const w of item.legitimateWorkarounds) {
      const wat = `${at}/workaround:${w.title}`;
      if (w.constraints.length === 0)
        err(fileName, wat, 'Workaround sin constraints.', 'Añade al menos una restricción.');
      if (w.rejectWhen.length === 0)
        err(fileName, wat, 'Workaround sin rejectWhen.', 'Indica cuándo rechazarlo.');
      if (w.risks.length === 0) err(fileName, wat, 'Workaround sin risks.', 'Indica sus riesgos.');
    }

    // Forbidden-DIY scan across EVERY player-facing field of the item.
    for (const pattern of scanForbidden(collectItemText(item))) {
      err(
        fileName,
        at,
        `Posible bricolaje peligroso: ${pattern.description} [${pattern.id}]`,
        FIX_FORBIDDEN,
      );
    }

    // Normative-risk categories must not rest solely on placeholder sources.
    if (
      (item.category === 'licence' || item.category === 'community') &&
      allPlaceholder(item.sourceIds)
    ) {
      warn(
        fileName,
        at,
        'Item normativo (licence/community) respaldado solo por fuentes placeholder.',
        'Añade una fuente real (no placeholder) antes de validar.',
      );
    }

    // Price/percentage figures should be clearly game-fiction, not asserted facts.
    if (PRICE_RE.test(item.scenarioText)) {
      warn(
        fileName,
        at,
        'Cifra monetaria o porcentaje en el escenario.',
        'Confirma que es ficción del juego, no una afirmación de precio real.',
      );
    }

    if (item.expertReview.required === false) {
      warn(
        fileName,
        at,
        'expertReview.required = false en contenido técnico.',
        'Confirma que realmente no necesita revisión experta.',
      );
    }
  }

  for (const card of pack.cards) {
    cardCount += 1;
    const at = `card:${card.id}`;
    if (card.sourceIds.length === 0) {
      err(fileName, at, 'La carta no referencia ninguna fuente.', 'Añade al menos un sourceId.');
    }
    checkSources(at, card.sourceIds);
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

// --- Report ----------------------------------------------------------------

const errors = issues.filter((i) => i.severity === 'error');
const warns = issues.filter((i) => i.severity === 'warn');

console.log('\n=== Content lint =========================================');
console.log(`Files: ${levelFiles.length} level pack(s), ${sources.length} source(s)`);
console.log(`Scanned: ${itemCount} item(s), ${cardCount} card(s)`);

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
