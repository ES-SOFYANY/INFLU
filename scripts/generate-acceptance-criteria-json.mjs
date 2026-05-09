#!/usr/bin/env node
/**
 * One-off generator for acceptance-criteria.json
 * Parses docs/01-product-owner/acceptance-criteria.md and produces a structured
 * JSON consumed by API/Frontend Story Implementers.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AC_MD = path.join(ROOT, 'docs/01-product-owner/acceptance-criteria.md');
const AC_JSON = path.join(ROOT, 'docs/01-product-owner/acceptance-criteria.json');

const text = fs.readFileSync(AC_MD, 'utf-8');

const scenariosByUs = {};
let total = 0;

// Split per US section
const usSections = text.split(/(?=^###\s+US-\d{3}:)/m).filter(s => /^###\s+US-\d{3}:/m.test(s));

for (const section of usSections) {
  const usMatch = section.match(/^###\s+(US-\d{3}):/m);
  if (!usMatch) continue;
  const usId = usMatch[1];
  const list = [];

  // Each scenario block starts with **AC-NNN-NN — Title**
  const blockRe = /\*\*(AC-\d{3}-\d{2})\s*[—–-]\s*(.+?)\*\*\s*\n```gherkin\s*([\s\S]*?)```/g;
  let m;
  while ((m = blockRe.exec(section)) !== null) {
    const id = m[1];
    const title = m[2].trim();
    const body = m[3];
    const scenarioMatch = body.match(/Scénario\s*:\s*(.+)/i);
    const givenMatch = body.match(/^\s*Given\s+([\s\S]+?)(?=^\s*(When|Then|And|$))/im);
    const whenMatch = body.match(/^\s*When\s+([\s\S]+?)(?=^\s*(Then|And|$))/im);
    const thenMatch = body.match(/^\s*Then\s+([\s\S]+?)(?=^\s*(And|$|```))/im);
    list.push({
      id,
      title,
      scenario: scenarioMatch ? scenarioMatch[1].trim() : title,
      given: givenMatch ? givenMatch[1].trim().replace(/\n\s+/g, ' ') : null,
      when: whenMatch ? whenMatch[1].trim().replace(/\n\s+/g, ' ') : null,
      then: thenMatch ? thenMatch[1].trim().replace(/\n\s+/g, ' ') : null,
    });
    total++;
  }
  if (list.length > 0) scenariosByUs[usId] = list;
}

const out = {
  generated_at: new Date().toISOString(),
  total_scenarios: total,
  scenarios_by_us: scenariosByUs,
};

fs.writeFileSync(AC_JSON, JSON.stringify(out, null, 2) + '\n');
console.log(`✅ Written ${path.relative(ROOT, AC_JSON)} (${total} scenarios across ${Object.keys(scenariosByUs).length} US)`);
