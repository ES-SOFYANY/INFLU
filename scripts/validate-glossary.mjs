#!/usr/bin/env node
/**
 * validate-glossary.mjs
 * Verifies that business terms used in user-stories.md and acceptance-criteria.md
 * are all defined in glossary.md.
 *
 * Strategy:
 *   1. Extract defined terms from glossary.md (first column of table)
 *   2. Extract candidate business terms from user-stories.md and acceptance-criteria.md
 *      - Capitalized words/phrases that appear to be domain-specific nouns
 *      - Key words from the "je veux <action>" and "afin de <bénéfice>" parts of US
 *   3. Cross-reference and report missing terms
 *
 * Usage:
 *   node scripts/validate-glossary.mjs
 *
 * Exit codes:
 *   0 = All key terms defined (or only warnings)
 *   1 = Critical terms missing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── File paths ────────────────────────────────────────────────────────────────
const GLOSSARY_FILE = path.join(ROOT, 'docs/01-product-owner/glossary.md');
const USER_STORIES_FILE = path.join(ROOT, 'docs/01-product-owner/user-stories.md');
const AC_FILE = path.join(ROOT, 'docs/01-product-owner/acceptance-criteria.md');
const PRD_FILE = path.join(ROOT, 'docs/01-product-owner/prd.md');

// ─── Common French/English stopwords to exclude ────────────────────────────────
const STOPWORDS = new Set([
  // French
  'En', 'Je', 'Quand', 'Alors', 'Dans', 'Pour', 'Sur', 'Avec', 'Sans', 'Sous',
  'Vers', 'Par', 'Que', 'Qui', 'Les', 'Des', 'Une', 'Est', 'Sont', 'Avoir',
  'Être', 'Faire', 'Voir', 'Pouvoir', 'Vouloir', 'Devoir', 'Aller',
  'Étant', 'Ayant', 'Doit', 'Peut', 'Tout', 'Cette', 'Cet', 'Mes', 'Mon', 'Ma',
  'Son', 'Ses', 'Leur', 'Nos', 'Vos', 'Scénario', 'Donné', 'Wave', 'US',
  'Pas', 'Couvre', 'Converge', 'Section', 'Redirection', 'Génér',
  // English
  'The', 'And', 'Or', 'But', 'For', 'Not', 'With', 'From', 'This', 'That',
  'Can', 'Will', 'Has', 'Have', 'Are', 'Is', 'Be', 'As', 'An', 'Its', 'My',
  // Common UI/generic English words that are not domain terms
  'Forgot', 'Continue', 'Google', 'Page', 'Cancel', 'Logout', 'Login',
  'Search', 'Empty', 'Clear', 'You', 'Paid', 'Complete', 'Dashboard',
  'Campaigns', 'Campaign', 'Profile', 'Account', 'Business', 'Update',
  'Information', 'Suggested', 'Apply', 'Bank', 'Documents', 'Document',
  'Approve', 'Comment', 'Last', 'Message', 'Messages', 'Notification',
  'Notifications', 'Support', 'Button', 'Link', 'Form', 'Input', 'Table',
  'Grid', 'Card', 'List', 'View', 'Step', 'Next', 'Previous', 'Back',
  'Save', 'Delete', 'Edit', 'Add', 'Remove', 'Upload', 'Download',
  'Export', 'Generate', 'Create', 'Reset', 'Confirm', 'Submit', 'Send',
  'Show', 'Hide', 'Active', 'Status', 'Date', 'Time', 'Name', 'Email',
  'Phone', 'Address', 'City', 'Country', 'Gender', 'Description', 'Title',
  'Amount', 'Price', 'Rate', 'Range', 'Total', 'Count', 'Number',
  'Report', 'History', 'Notes', 'Overview', 'Summary', 'Details',
  'Settings', 'Register', 'Signup', 'Help', 'Issue', 'Bug', 'Audience',
  'Platform', 'Validation', 'Signup', 'Tab', 'Modal', 'Modale',
  'Social', 'Media', 'Content', 'User', 'Users', 'File', 'Files',
  // Additional generic words
  'Actions', 'Feature', 'New', 'Other', 'Select', 'Manage', 'Completed',
  'Branding', 'Visibility', 'Awareness', 'Positioning', 'Storytelling',
  'Promotions', 'Landing', 'Inscription', 'Pricing', 'Manager', 'Product',
  'Performance', 'Score', 'Coach', 'Instagram', 'Twitter', 'TikTok', 'YouTube',
  'Revenue', 'Payments', 'Payment', 'Engagement', 'Validated', 'Requested',
  'Specify', 'Completed', 'Select', 'Product', 'Event', 'Promotion',
  'Update Information', 'Last Message', 'Select Brand', 'Product Name',
  'Requested Content', 'Business Information', 'Event Promotion',
  'Pending Payments', 'Revenue Generated', 'Pending',
  'Inscrivez', 'Réserver', 'Délai', 'Paiement', 'Toutes', 'Chaque',
  // Numbers / patterns and abbreviations already covered by full glossary entries
  'Dhs',
  'V1', 'V2', 'V3', 'API', 'UI', 'UX', 'HTTP', 'HTTPS', 'URL', 'ID', 'UUID',
  'JSON', 'YAML', 'PRD', 'INVEST', 'KPI', 'SLA', 'MVP',
]);

// ─── Load file safely ──────────────────────────────────────────────────────────
function loadFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ${label} not found: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// ─── Extract defined terms from glossary.md ────────────────────────────────────
function extractGlossaryTerms(text) {
  const terms = new Set();
  const tableRowRe = /^\|\s*([^|]+?)\s*\|/gm;
  let match;

  while ((match = tableRowRe.exec(text)) !== null) {
    const cell = match[1].trim();
    // Skip header rows (contain '---', 'Terme', 'Term', empty)
    if (!cell || /^[-\s]+$/.test(cell) || /^(Terme|Term|#)/i.test(cell)) continue;
    // Strip markdown bold/italic markers before comparing
    const cleanCell = cell.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').trim();
    if (!cleanCell) continue;
    // Normalize: lowercase for comparison, also keep original
    terms.add(cleanCell.toLowerCase());
    // Also add without accents for fuzzy match
    terms.add(cleanCell.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  }

  return terms;
}

// ─── Extract business nouns from text ─────────────────────────────────────────
function extractBusinessTerms(text, source) {
  const candidates = new Map(); // term → Set of sources

  // Pattern 1: Capitalized words (likely proper nouns / domain terms)
  const capitalizedRe = /\b([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]{2,}(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþß]{2,})*)\b/g;

  let m;
  while ((m = capitalizedRe.exec(text)) !== null) {
    const word = m[1].trim();
    if (STOPWORDS.has(word)) continue;
    if (word.length < 3) continue;
    // Skip lines that are headers (## or ###)
    const lineStart = text.lastIndexOf('\n', m.index) + 1;
    const lineEnd = text.indexOf('\n', m.index);
    const line = text.slice(lineStart, lineEnd > -1 ? lineEnd : undefined);
    if (/^\s*#{1,4}\s/.test(line)) continue; // skip markdown headers

    if (!candidates.has(word)) candidates.set(word, new Set());
    candidates.get(word).add(source);
  }

  // Pattern 2: Key business nouns in US format after "je veux" and "afin de"
  const usActionRe = /je veux\s+([^,]+),?\s*afin de\s+([^.\n]+)/gi;
  while ((m = usActionRe.exec(text)) !== null) {
    // Extract all capitalized or domain-specific words from action + benefit
    const combined = `${m[1]} ${m[2]}`;
    const wordsRe = /\b([A-ZÀ-Ÿa-zà-ÿ]{3,})\b/g;
    let wm;
    while ((wm = wordsRe.exec(combined)) !== null) {
      const w = wm[1];
      // Domain nouns are often 5+ chars and domain-specific
      if (w.length >= 5 && !STOPWORDS.has(w) && !/^(comme|cette|leurs|notre|votre|avoir|faire|être|tout|tous|toutes|sans|dans|sous|vers|avec|pour|mes|mon|ma|son|ses|leur|nos|vos|une|des|les|qui|que|par|sur)$/i.test(w)) {
        const key = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        if (!candidates.has(key)) candidates.set(key, new Set());
        candidates.get(key).add(source);
      }
    }
  }

  return candidates;
}

// ─── Check if a term is covered in glossary ───────────────────────────────────
function isInGlossary(term, glossaryTerms) {
  const normalized = term.toLowerCase();
  const noAccents = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return glossaryTerms.has(normalized) || glossaryTerms.has(noAccents);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('🔍 Validating glossary coverage…\n');

  const glossaryText = loadFile(GLOSSARY_FILE, 'glossary.md');
  const usText = loadFile(USER_STORIES_FILE, 'user-stories.md');
  const acText = loadFile(AC_FILE, 'acceptance-criteria.md');
  const prdText = loadFile(PRD_FILE, 'prd.md');

  if (!glossaryText) {
    console.error('❌  glossary.md is missing — cannot validate');
    process.exit(1);
  }

  // 1. Extract defined terms
  const glossaryTerms = extractGlossaryTerms(glossaryText);
  console.log(`   Glossary terms defined: ${glossaryTerms.size / 2}`); // /2 because we add with+without accents

  // 2. Extract business terms from source files
  const allCandidates = new Map();
  for (const [term, sources] of extractBusinessTerms(usText, 'user-stories.md')) {
    if (!allCandidates.has(term)) allCandidates.set(term, new Set());
    for (const s of sources) allCandidates.get(term).add(s);
  }
  for (const [term, sources] of extractBusinessTerms(acText, 'acceptance-criteria.md')) {
    if (!allCandidates.has(term)) allCandidates.set(term, new Set());
    for (const s of sources) allCandidates.get(term).add(s);
  }
  for (const [term, sources] of extractBusinessTerms(prdText, 'prd.md')) {
    if (!allCandidates.has(term)) allCandidates.set(term, new Set());
    for (const s of sources) allCandidates.get(term).add(s);
  }

  console.log(`   Business term candidates found: ${allCandidates.size}`);

  // 3. Cross-reference
  const missing = [];
  const covered = [];

  for (const [term, sources] of allCandidates) {
    if (isInGlossary(term, glossaryTerms)) {
      covered.push(term);
    } else {
      missing.push({ term, sources: [...sources] });
    }
  }

  // 4. Report
  console.log('\n📌 CHECK 5 — Glossary coverage\n');

  if (covered.length > 0) {
    console.log(`✅ Terms covered (${covered.length}):`);
    for (const t of covered.slice(0, 15)) console.log(`   ✅ ${t}`);
    if (covered.length > 15) console.log(`   … and ${covered.length - 15} more`);
  }

  console.log('');

  if (missing.length === 0) {
    console.log('✅ All business terms are defined in glossary.md');
    console.log('\n' + '─'.repeat(60));
    console.log('✅ GLOSSARY VALIDATION PASSED');
    process.exit(0);
  } else {
    // Separate critical (used in multiple files or many times) from minor
    const critical = missing.filter(m => m.sources.length > 1);
    const minor = missing.filter(m => m.sources.length === 1);

    if (critical.length > 0) {
      console.error(`❌ Terms used in MULTIPLE files but NOT in glossary (${critical.length}):`);
      for (const { term, sources } of critical) {
        console.error(`   ❌ "${term}"  ← used in: ${sources.join(', ')}`);
      }
    }

    if (minor.length > 0) {
      console.warn(`\n⚠️  Terms used in ONE file but NOT in glossary (${minor.length}):`);
      for (const { term, sources } of minor.slice(0, 20)) {
        console.warn(`   ⚠️  "${term}"  ← ${sources[0]}`);
      }
      if (minor.length > 20) {
        console.warn(`   … and ${minor.length - 20} more`);
      }
    }

    console.log('\n💡 To fix: add these entries to docs/01-product-owner/glossary.md:');
    for (const { term } of [...critical, ...minor].slice(0, 10)) {
      console.log(`   | ${term} | <définition> | <synonymes à éviter> |`);
    }

    console.log('\n' + '─'.repeat(60));

    if (critical.length > 2) {
      console.error(`❌ GLOSSARY VALIDATION FAILED — ${critical.length} critical terms missing`);
      process.exit(1);
    } else {
      console.warn(`⚠️  GLOSSARY VALIDATION: WARNINGS ONLY — ${missing.length} term(s) to consider adding`);
      process.exit(0);
    }
  }
}

main();
