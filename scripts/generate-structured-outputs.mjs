#!/usr/bin/env node
/**
 * generate-structured-outputs.mjs
 * Parses Product Owner markdown deliverables and generates machine-readable
 * JSON files consumed by downstream agents (Solution Architect, Tech Lead,
 * Database Engineer, API Developer, Frontend Developer).
 *
 * Outputs:
 *   docs/01-product-owner/user-stories.json         — structured US list
 *   docs/01-product-owner/dependencies-graph.json   — DAG as adjacency list
 *   docs/01-product-owner/personas.json             — personas from PRD
 *   docs/01-product-owner/validation-report.json    — template for PO Validator
 *
 * Usage:
 *   node scripts/generate-structured-outputs.mjs
 *
 * Exit codes:
 *   0 = success
 *   1 = critical parse error
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PO_DIR = path.join(ROOT, 'docs/01-product-owner');

// ─── Helpers ───────────────────────────────────────────────────────────────────
function loadFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`   ✅ Written: ${path.relative(ROOT, filePath)}`);
}

// ─── 1. Parse user-stories.md → user-stories.json ─────────────────────────────
function parseUserStories(usText, acText, wavesData) {
  const stories = [];

  // Build a map of US-NNN → [AC-NNN-NN, ...] from acceptance-criteria.md
  const acIdsByUs = {};
  if (acText) {
    const acIdRe = /\bAC-(\d{3})-(\d{2})\b/g;
    const sectionRe = /^#{1,4}\s*(US-\d{3})/gim;
    const sections = acText.split(/(?=^#{1,4}\s+US-\d{3})/im);
    for (const section of sections) {
      const hdr = section.match(/^#{1,4}\s*(US-\d{3})/im);
      if (!hdr) continue;
      const us = hdr[1].toUpperCase();
      const ids = [...section.matchAll(/\bAC-\d{3}-\d{2}\b/g)].map(m => m[0]);
      if (ids.length > 0) acIdsByUs[us] = [...new Set(ids)];
    }
  }

  // Build US → wave map
  const waveByUs = {};
  if (wavesData) {
    for (const w of wavesData) {
      for (const us of w.userStories) waveByUs[us] = w.wave;
    }
  }

  // Split on story blocks: ### US-NNN — ...
  const blockSplitRe = /(?=^#{1,4}\s+US-\d{3}\s*[—–-])/im;
  const blocks = usText.split(blockSplitRe).filter(b => /^#{1,4}\s+US-\d{3}/im.test(b));

  for (const block of blocks) {
    // Extract heading line
    const headingMatch = block.match(/^(#{1,4})\s+(US-\d{3})\s*[—–-]+\s*(.+)/im);
    if (!headingMatch) continue;

    const id = headingMatch[2].trim().toUpperCase();
    const headingText = headingMatch[3].trim();

    // Parse "As a <persona>, I want to <action>, so that <benefit>"
    const enMatch = headingText.match(/^As\s+a[n]?\s+(.+?),\s*I want(?:\s+to)?\s+(.+?),\s*so that\s+(.+?)\.?\s*$/i);
    const frMatch = headingText.match(/^En tant que\s+(.+?),\s*je veux\s+(.+?),\s*afin de\s+(.+?)\.?\s*$/i);

    let role = 'unknown', action = 'unknown', benefit = 'unknown';
    if (enMatch) { role = enMatch[1].trim(); action = enMatch[2].trim(); benefit = enMatch[3].trim(); }
    else if (frMatch) { role = frMatch[1].trim(); action = frMatch[2].trim(); benefit = frMatch[3].trim(); }

    // Short title: first 6 words of action
    const titleWords = action.split(/\s+/).slice(0, 6).join(' ');
    const title = titleWords.length < action.length ? titleWords + '…' : titleWords;

    // Priority from **Priority:** Must | **Wave:** N line
    const priorityMatch = block.match(/\*\*Priority:\*\*\s*(Must|Should|Could)/i);
    const waveInlineMatch = block.match(/\*\*Wave:\*\*\s*(\d+)/i);
    const priority = priorityMatch ? priorityMatch[1] : 'Should';
    const wave = waveInlineMatch ? parseInt(waveInlineMatch[1]) : (waveByUs[id] || null);

    stories.push({
      id,
      title: id + ' — ' + title,
      role,
      description: `As a ${role}, I want to ${action}, so that ${benefit}.`,
      acceptance_criteria_ids: acIdsByUs[id] || [],
      priority,
      wave,
    });
  }

  return stories;
}

// ─── 2. Parse story-sequencing.md → dependencies-graph.json ───────────────────
function parseDependencyGraph(text) {
  const graph = {};

  // Find the dependency matrix table (§ 1 section)
  // Supports 4-column tables: | US-NNN | Dépend de | Type | Notes |
  // Supports 5-column tables: | US-NNN | Title | Dépend de | Type | Notes |
  const tableRowRe = /^\|\s*(US-\d{3,})\s*\|([^|\n]+)\|([^|\n]*)\|([^|\n]*)\|/gm;

  let m;
  while ((m = tableRowRe.exec(text)) !== null) {
    const us = m[1].trim();
    const col2 = m[2].trim();
    const col3 = m[3].trim();
    const col4 = m[4].trim();

    // Skip header/separator rows
    if (/^[-\s]+$/.test(col2) || /dépend/i.test(col2) || /titre/i.test(col2)) continue;

    // Detect 5-column table: if col2 doesn't contain US-NNN refs but col3 might
    const col2HasUs = /US-\d{3}/.test(col2) || col2 === '—' || col2 === '-' || col2 === '';
    const rawDeps = col2HasUs ? col2 : col3;
    const type = col2HasUs ? col3 : col4;
    const notes = col2HasUs ? col4 : '';

    const deps = (rawDeps === '—' || rawDeps === '-' || rawDeps === '')
      ? []
      : rawDeps
          .split(',')
          .map(d => d.trim())
          .filter(d => /^US-\d{3,}$/.test(d));

    graph[us] = {
      dependencies: deps,
      dependencyType: type || null,
      notes: notes || null,
    };
  }

  return graph;
}

// ─── 3. Parse waves from story-sequencing.md ──────────────────────────────────
function parseWaves(text) {
  const waves = [];
  const sections = text.split(/^(?=##\s+Wave\s+\d)/im);

  for (const section of sections) {
    const headerMatch = section.match(/^##\s+Wave\s+(\d+)\s*[—–-]*\s*(.+)?/im);
    if (!headerMatch) continue;

    const waveNum = parseInt(headerMatch[1]);
    const waveLabel = headerMatch[2]?.trim() || '';
    const usMatches = [...section.matchAll(/\b(US-\d{3,})\b/g)].map(m => m[1]);
    const parallelNote = section.match(/parallél[^.]+/i)?.[0] || null;

    waves.push({
      wave: waveNum,
      label: waveLabel,
      userStories: [...new Set(usMatches)],
      parallelizable: parallelNote,
    });
  }

  return waves;
}

// ─── 4. Parse personas from prd.md ────────────────────────────────────────────
function parsePersonas(text) {
  const personas = [];

  // Split on top-level ## sections and find the Personas section
  const sections = text.split(/^(?=## )/m);
  const personaSection = sections.find(s =>
    /^## \d*\.?\s*Personas?/im.test(s) ||
    /^## \d*\.?\s*Personnages?/im.test(s) ||
    /^## \d*\.?\s*Utilisateurs?/im.test(s)
  ) || '';

  // Extract ### level headers as persona names
  let m;
  const headerRe = /^###?\s+(.+)/gm;
  while ((m = headerRe.exec(personaSection)) !== null) {
    const name = m[1].trim().replace(/^\*+|\*+$/g, '');
    if (name.length > 2 && !/^(Vision|Scope|Hors|Objectif|Hypothèse|Risque|Point|Context)/i.test(name)) {
      const start = m.index + m[0].length;
      const nextHeader = personaSection.indexOf('\n#', start);
      const desc = personaSection
        .slice(start, nextHeader > -1 ? nextHeader : start + 500)
        .trim()
        .split('\n')[0]
        .trim();
      personas.push({ name, description: desc || null });
    }
  }

  // Fallback: look for bold persona names
  if (personas.length === 0) {
    const boldRe = /\*\*([^*]+)\*\*/g;
    while ((m = boldRe.exec(personaSection)) !== null) {
      const name = m[1].trim();
      if (name.length > 2 && name.split(' ').length <= 4) {
        personas.push({ name, description: null });
      }
    }
  }

  return personas;
}

// ─── 5. Count AC per US from acceptance-criteria.md ───────────────────────────
function parseAcceptanceCriteria(text) {
  const acByUs = {};

  // Group scenarios by US header
  const sections = text.split(/(?=^###?\s+US-\d{3,})/im);

  for (const section of sections) {
    const headerMatch = section.match(/^###?\s+(US-\d{3,})/im);
    if (!headerMatch) continue;

    const usId = headerMatch[1].trim();
    const scenarioCount = (section.match(/^Scénario\s*:/gim) || []).length;

    acByUs[usId] = {
      scenarioCount,
      isValid: scenarioCount >= 2 && scenarioCount <= 5,
    };
  }

  return acByUs;
}

// ─── 6. Create validation report template ─────────────────────────────────────
function createValidationTemplate(userStories, personas) {
  return {
    timestamp: new Date().toISOString(),
    iteration: 1,
    status: 'PENDING_VALIDATION',
    quality_score: 0,
    is_ready_for_sa: false,
    checks: {
      requirement_coverage: {
        score: 0,
        max: 30,
        percentage: 0,
        covered: 0,
        total: 0,
        missing_requirements: [],
      },
      persona_coverage: {
        score: 0,
        max: 15,
        percentage: 0,
        covered_personas: 0,
        total_personas: personas.length,
        orphaned_personas: [],
      },
      dag_validity: {
        score: 0,
        max: 15,
        cycles_detected: 0,
        is_valid_dag: false,
        cycles: [],
      },
      acceptance_criteria_completeness: {
        score: 0,
        max: 15,
        percentage: 0,
        valid_us: 0,
        total_us: userStories.length,
        invalid_us: [],
      },
      glossary_completeness: {
        score: 0,
        max: 10,
        percentage: 0,
        unique_terms_found: 0,
        terms_defined: 0,
        missing_terms: [],
      },
      dependency_validity: {
        score: 0,
        max: 5,
        valid_dependencies: 0,
        total_dependencies: 0,
        invalid_references: [],
      },
      topological_order: {
        score: 0,
        max: 5,
        is_valid_topo_sort: false,
        wave_errors: [],
      },
      orphaned_user_stories: {
        score: 0,
        max: 5,
        orphaned_count: 0,
        orphaned: [],
      },
    },
    corrections_required: [],
    next_step: 'CALL_PO_VALIDATOR',
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────────
function main() {
  console.log('🔧 Generating structured outputs for Product Owner deliverables…\n');

  let hasError = false;

  // ── user-stories.json ──────────────────────────────────────────────────────
  const usText = loadFile(path.join(PO_DIR, 'user-stories.md'));
  if (!usText) {
    console.error('❌  user-stories.md not found');
    hasError = true;
  } else {
    // Load AC and waves data for enrichment (may be null if files not yet generated)
    const acText = loadFile(path.join(PO_DIR, 'acceptance-criteria.md'));
    const seqTextEarly = loadFile(path.join(PO_DIR, 'story-sequencing.md'));
    const wavesEarly = seqTextEarly ? parseWaves(seqTextEarly) : [];
    const stories = parseUserStories(usText, acText, wavesEarly);
    if (stories.length === 0) {
      console.error('❌  No user stories parsed from user-stories.md');
      console.error('    Expected format (EN): US-NNN — As a <persona>, I want to <action>, so that <benefit>.');
      console.error('    Expected format (FR): US-NNN — En tant que <persona>, je veux <action>, afin de <bénéfice>.');
      hasError = true;
    } else {
      writeJson(path.join(PO_DIR, 'user-stories.json'), stories);
      console.log(`   → ${stories.length} user stories extracted`);
    }
  }

  // ── dependencies-graph.json ────────────────────────────────────────────────
  const seqText = loadFile(path.join(PO_DIR, 'story-sequencing.md'));
  if (!seqText) {
    console.error('❌  story-sequencing.md not found');
    hasError = true;
  } else {
    const graph = parseDependencyGraph(seqText);
    const waves = parseWaves(seqText);
    const graphCount = Object.keys(graph).length;

    if (graphCount === 0) {
      console.error('❌  No dependency rows parsed from story-sequencing.md');
      hasError = true;
    } else {
      // Full graph with .dependencies property (consumed by validate-dag.mjs)
      writeJson(path.join(PO_DIR, 'dependencies-graph.json'), graph);
      console.log(`   → ${graphCount} US in dependency graph`);

      // Extended graph with metadata
      writeJson(path.join(PO_DIR, 'story-sequencing.json'), {
        graph,
        waves,
        generatedAt: new Date().toISOString(),
      });
    }
  }

  // ── personas.json ──────────────────────────────────────────────────────────
  const prdText = loadFile(path.join(PO_DIR, 'prd.md'));
  let personas = [];
  if (!prdText) {
    console.warn('⚠️  prd.md not found — skipping personas extraction');
  } else {
    personas = parsePersonas(prdText);
    if (personas.length === 0) {
      console.warn('⚠️  No personas parsed from prd.md (check your personas section format)');
    } else {
      writeJson(path.join(PO_DIR, 'personas.json'), personas);
      console.log(`   → ${personas.length} personas extracted`);
    }
  }

  // ── AC summary ────────────────────────────────────────────────────────────
  const acText = loadFile(path.join(PO_DIR, 'acceptance-criteria.md'));
  let acSummary = {};
  if (!acText) {
    console.warn('⚠️  acceptance-criteria.md not found');
  } else {
    acSummary = parseAcceptanceCriteria(acText);
    const valid = Object.values(acSummary).filter(v => v.isValid).length;
    const total = Object.keys(acSummary).length;
    console.log(`   → ${valid}/${total} US have valid AC (2-5 scenarios)`);
  }

  // ── validation-report.json (template) ─────────────────────────────────────
  const userStories = usText ? parseUserStories(usText) : [];
  const reportTemplate = createValidationTemplate(userStories, personas);
  writeJson(path.join(PO_DIR, 'validation-report.json'), reportTemplate);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  if (hasError) {
    console.error('❌ GENERATION FAILED — Fix the issues above');
    process.exit(1);
  } else {
    console.log('✅ All structured outputs generated successfully');
    console.log('\n   Files ready for PO Validator:');
    console.log('   📄 docs/01-product-owner/user-stories.json');
    console.log('   📄 docs/01-product-owner/dependencies-graph.json');
    console.log('   📄 docs/01-product-owner/story-sequencing.json');
    console.log('   📄 docs/01-product-owner/personas.json');
    console.log('   📄 docs/01-product-owner/validation-report.json');
    console.log('\n   Next step:');
    console.log('   → node scripts/validate-dag.mjs');
    console.log('   → node scripts/validate-glossary.mjs');
    process.exit(0);
  }
}

main();
