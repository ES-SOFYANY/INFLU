#!/usr/bin/env node
/**
 * validate-dag.mjs
 * Validates the dependency graph in dependencies-graph.json:
 *   1. Checks all referenced US IDs exist
 *   2. Detects cycles (a valid DAG has none)
 *   3. Performs topological sort
 *   4. Verifies waves in story-sequencing.md are topologically valid
 *
 * Usage:
 *   node scripts/validate-dag.mjs
 *
 * Exit codes:
 *   0 = DAG valid
 *   1 = Cycle detected or missing node
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PO_DIR = path.join(ROOT, 'docs/01-product-owner');

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ─── Load graph ────────────────────────────────────────────────────────────────
const graphFile = path.join(PO_DIR, 'dependencies-graph.json');
const graph = loadJson(graphFile);

console.log('\n🔍 Validating Dependency DAG…\n');

const nodes = Object.keys(graph);
console.log(`   Nodes in graph: ${nodes.length}`);

// ─── 1. Check all referenced dependencies exist ────────────────────────────────
let missingRefs = [];
for (const [us, data] of Object.entries(graph)) {
  const deps = data.dependencies || [];
  for (const dep of deps) {
    if (!graph[dep]) {
      missingRefs.push({ from: us, missing: dep });
    }
  }
}

if (missingRefs.length > 0) {
  console.log(`\n❌ CHECK 1 — Missing dependency references:`);
  for (const ref of missingRefs) {
    console.log(`   ${ref.from} references unknown node ${ref.missing}`);
  }
} else {
  console.log('   ✅ CHECK 1 — All dependency references resolved');
}

// ─── 2. Cycle detection (DFS with coloring) ─────────────────────────────────────
const WHITE = 0, GRAY = 1, BLACK = 2;
const color = {};
nodes.forEach(n => (color[n] = WHITE));
let cycles = [];

function dfs(node, path) {
  color[node] = GRAY;
  const deps = (graph[node]?.dependencies) || [];
  for (const dep of deps) {
    if (!graph[dep]) continue; // already reported above
    if (color[dep] === GRAY) {
      const cycleStart = path.indexOf(dep);
      cycles.push([...path.slice(cycleStart), dep]);
    } else if (color[dep] === WHITE) {
      dfs(dep, [...path, dep]);
    }
  }
  color[node] = BLACK;
}

for (const node of nodes) {
  if (color[node] === WHITE) {
    dfs(node, [node]);
  }
}

if (cycles.length > 0) {
  console.log(`\n❌ CHECK 2 — Cycles detected (${cycles.length}):`);
  for (const cycle of cycles) {
    console.log(`   Cycle: ${cycle.join(' → ')}`);
  }
  process.exit(1);
} else {
  console.log('   ✅ CHECK 2 — No cycles detected — DAG is valid');
}

// ─── 3. Topological sort (Kahn's algorithm) ─────────────────────────────────────
const inDegree = {};
nodes.forEach(n => (inDegree[n] = 0));
for (const [us, data] of Object.entries(graph)) {
  for (const dep of (data.dependencies || [])) {
    if (graph[dep]) inDegree[us] = (inDegree[us] || 0); // us depends on dep
  }
}

// Build adjacency list: dep → [dependents]
const adj = {};
nodes.forEach(n => (adj[n] = []));
for (const [us, data] of Object.entries(graph)) {
  for (const dep of (data.dependencies || [])) {
    if (graph[dep]) adj[dep].push(us);
  }
}

// Recalculate in-degree
const inDeg = {};
nodes.forEach(n => (inDeg[n] = 0));
for (const [us, data] of Object.entries(graph)) {
  for (const dep of (data.dependencies || [])) {
    if (graph[dep]) inDeg[us] = (inDeg[us] || 0) + 1;
  }
}

const queue = nodes.filter(n => (inDeg[n] || 0) === 0).sort();
const sorted = [];

while (queue.length > 0) {
  const node = queue.shift();
  sorted.push(node);
  for (const dependent of (adj[node] || [])) {
    inDeg[dependent]--;
    if (inDeg[dependent] === 0) {
      queue.push(dependent);
      queue.sort();
    }
  }
}

if (sorted.length !== nodes.length) {
  console.log('\n❌ CHECK 3 — Topological sort incomplete (cycle residual)');
  process.exit(1);
} else {
  console.log(`   ✅ CHECK 3 — Topological order: ${sorted.join(' → ')}`);
}

// ─── 4. Load wave data and validate ────────────────────────────────────────────
const seqFile = path.join(PO_DIR, 'story-sequencing.json');
if (fs.existsSync(seqFile)) {
  const seqData = loadJson(seqFile);
  const waves = seqData.waves || [];

  let waveErrors = [];
  const processedInPreviousWaves = new Set();

  for (const wave of waves) {
    for (const us of (wave.userStories || [])) {
      const deps = (graph[us]?.dependencies) || [];
      for (const dep of deps) {
        if (!processedInPreviousWaves.has(dep) && (wave.userStories || []).includes(dep)) {
          // Same-wave dependency - acceptable if noted as parallelizable
        } else if (!processedInPreviousWaves.has(dep) && !(wave.userStories || []).includes(dep)) {
          waveErrors.push(`Wave ${wave.wave}: ${us} depends on ${dep} which appears in a later wave or is missing`);
        }
      }
    }
    (wave.userStories || []).forEach(us => processedInPreviousWaves.add(us));
  }

  if (waveErrors.length > 0) {
    console.log(`\n⚠️  CHECK 4 — Wave ordering warnings (${waveErrors.length}):`);
    waveErrors.forEach(e => console.log(`   ${e}`));
  } else {
    console.log('   ✅ CHECK 4 — Wave ordering is topologically valid');
  }
} else {
  console.log('   ⚠️  CHECK 4 — story-sequencing.json not found, skipping wave validation');
}

// ─── Summary ───────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');

const hasErrors = missingRefs.length > 0 || cycles.length > 0;

if (hasErrors) {
  console.log('❌ DAG validation FAILED — fix the errors above before proceeding');
  process.exit(1);
} else {
  console.log('✅ DAG validation PASSED');
  console.log(`   ${nodes.length} nodes, 0 cycles, topological sort complete`);
}
