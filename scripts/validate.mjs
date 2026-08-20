import { readFile, access, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const passes = [];

const requiredFiles = [
  'index.html', '404.html', '.nojekyll', 'manifest.webmanifest', 'robots.txt',
  'assets/app.js', 'assets/config.js', 'assets/data.js', 'assets/realtime.js', 'assets/styles.css', 'assets/favicon.svg', 'assets/search-everywhere-operating-model.svg', 'assets/og-search-everywhere.jpg',
  'supabase/schema.sql', 'supabase/v3-upgrade.sql', 'supabase/cleanup.sql', 'supabase/README.md',
  'README.md', 'BACKUP_AND_DEPLOY.md',
  'docs/ARCHITECTURE.md', 'docs/DEPLOYMENT.md', 'docs/FACILITATOR_GUIDE.md', 'docs/WORKSHOP_RUN_OF_SHOW.md', 'docs/AUDIT_METHOD.md', 'docs/RESEARCH_BASIS.md', 'docs/QA_REPORT.md',
  '.github/workflows/pages.yml', 'Search_Everywhere_Lab_Standalone_Preview.html', 'scripts/install-into-repo.sh'
];

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function ok(label) {
  passes.push(label);
  console.log(`✓ ${label}`);
}
function fail(label) {
  failures.push(label);
  console.error(`✗ ${label}`);
}
function warn(label) {
  warnings.push(label);
  console.warn(`! ${label}`);
}

for (const file of requiredFiles) {
  (await exists(file)) ? ok(`Required file: ${file}`) : fail(`Missing required file: ${file}`);
}

for (const file of ['assets/app.js', 'assets/realtime.js', 'assets/data.js', 'scripts/configure-supabase.mjs']) {
  if (!(await exists(file))) continue;
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
    ok(`JavaScript syntax: ${file}`);
  } catch (error) {
    fail(`JavaScript syntax failed: ${file}\n${error.stderr?.toString() || error.message}`);
  }
}

const htmlFiles = ['index.html', '404.html'];
for (const htmlFile of htmlFiles) {
  if (!(await exists(htmlFile))) continue;
  const html = await readFile(path.join(root, htmlFile), 'utf8');
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  duplicates.length ? fail(`${htmlFile} contains duplicate IDs: ${duplicates.join(', ')}`) : ok(`${htmlFile} has unique static IDs`);

  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"'#?]+)["']/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    const normalized = ref.replace(/^\.\//, '').replace(/^\//, '');
    if (!normalized || normalized.endsWith('/')) continue;
    (await exists(normalized)) ? ok(`${htmlFile} reference resolves: ${ref}`) : fail(`${htmlFile} reference missing: ${ref}`);
  }
}

const css = await readFile(path.join(root, 'assets/styles.css'), 'utf8');
for (const match of css.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)) {
  const ref = match[2];
  if (/^(?:https?:|data:|#)/.test(ref)) continue;
  const resolved = path.normalize(path.join('assets', ref));
  (await exists(resolved)) ? ok(`CSS reference resolves: ${ref}`) : fail(`CSS reference missing: ${ref}`);
}

const dataUrl = pathToFileURL(path.join(root, 'assets/data.js')).href + `?validate=${Date.now()}`;
const data = await import(dataUrl);
const expected = { stages: 16, audit: 55, breezy: 24, kp: 31 };
const actual = {
  stages: data.STAGES.length,
  audit: data.SEED_AUDIT_ROWS.length,
  breezy: data.SEED_AUDIT_ROWS.filter((row) => row.clientKey === 'breezy').length,
  kp: data.SEED_AUDIT_ROWS.filter((row) => row.clientKey === 'kp').length
};
for (const [key, value] of Object.entries(expected)) {
  actual[key] === value ? ok(`Expected ${key} count: ${value}`) : fail(`Expected ${key} count ${value}, found ${actual[key]}`);
}

for (const [label, collection] of [
  ['stage', data.STAGES],
  ['platform', data.PLATFORMS],
  ['signal', data.SIGNALS],
  ['shock', data.SHOCKS],
  ['source', data.SOURCES],
  ['audit', data.SEED_AUDIT_ROWS]
]) {
  const ids = collection.map((item) => item.id);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  duplicates.length ? fail(`Duplicate ${label} IDs: ${duplicates.join(', ')}`) : ok(`Unique ${label} IDs`);
}

const validStageIds = new Set(data.STAGES.map((item) => item.id));
const expectedStageIds = ['welcome','fracture','cognition','definition','ecosystem','journey','portals','audit','whiteboard','wheel','auction','dualvision','shock','strategy','challenge','debrief'];
for (const id of expectedStageIds) {
  validStageIds.has(id) ? ok(`Stage registered: ${id}`) : fail(`Stage not registered: ${id}`);
}

for (const source of data.SOURCES) {
  try {
    const url = new URL(source.url);
    ['http:', 'https:'].includes(url.protocol) ? ok(`Valid source URL: ${source.id}`) : fail(`Unsupported source URL protocol: ${source.id}`);
  } catch {
    fail(`Invalid source URL: ${source.id}`);
  }
}

for (const row of data.SEED_AUDIT_ROWS) {
  if (!['breezy', 'kp'].includes(row.clientKey)) fail(`Audit row ${row.id} has invalid clientKey`);
  if (!Array.isArray(row.sourceUrls) || row.sourceUrls.length === 0) warn(`Audit row ${row.id} has no source URL`);
  if (!Number.isFinite(row.score) || row.score < 0 || row.score > 100) fail(`Audit row ${row.id} has invalid score`);
  for (const sourceUrl of row.sourceUrls || []) {
    try { new URL(sourceUrl); } catch { fail(`Audit row ${row.id} has invalid source URL: ${sourceUrl}`); }
  }
}
ok('Audit rows passed structural checks');

const appText = await readFile(path.join(root, 'assets/app.js'), 'utf8');
const realtimeText = await readFile(path.join(root, 'assets/realtime.js'), 'utf8');
const schemaText = await readFile(path.join(root, 'supabase/schema.sql'), 'utf8');
const capabilityChecks = [
  ['poll activity', 'fracture-choice', appText],
  ['Cognitive Search Reactor', 'renderCognition', appText],
  ['knowledge checks', 'knowledge-answer', appText],
  ['journey prediction', 'journey-predict', appText],
  ['journey transition lab', 'journey-insight-form', appText],
  ['participant wheel', 'renderWheel', appText],
  ['audit command center', 'renderAudit', appText],
  ['evidence whiteboard', 'renderWhiteboard', appText],
  ['Signal Auction', 'renderAuction', appText],
  ['Human + Machine view', 'renderDualVision', appText],
  ['Search Shock', 'renderShock', appText],
  ['Strategy War Room', 'renderStrategy', appText],
  ['Client Challenge', 'renderChallenge', appText],
  ['CSV export', 'exportSessionCsv', appText],
  ['cursor broadcast', "broadcast('cursor'", realtimeText],
  ['presence tracking', '.track(', realtimeText],
  ['local fallback', 'BroadcastChannel', realtimeText],
  ['room RLS', 'enable row level security', schemaText],
  ['room creation RPC', 'create_workshop_room', schemaText],
  ['room join RPC', 'join_workshop_room', schemaText]
];
for (const [label, needle, haystack] of capabilityChecks) {
  haystack.includes(needle) ? ok(`Capability present: ${label}`) : fail(`Capability missing: ${label}`);
}

for (const itemType of ['cognitive_profile','knowledge_answer','journey_prediction','wheel_response']) {
  schemaText.includes(`'${itemType}'`) ? ok(`Schema accepts v3 item type: ${itemType}`) : fail(`Schema missing v3 item type: ${itemType}`);
}
const upgradeText = await readFile(path.join(root, 'supabase/v3-upgrade.sql'), 'utf8');
for (const itemType of ['cognitive_profile','knowledge_answer','journey_prediction','wheel_response']) {
  upgradeText.includes(`'${itemType}'`) ? ok(`Upgrade migration accepts: ${itemType}`) : fail(`Upgrade migration missing: ${itemType}`);
}

const configText = await readFile(path.join(root, 'assets/config.js'), 'utf8');
if (/service[_-]?role/i.test(configText)) fail('assets/config.js appears to contain a service-role reference');
else ok('No service-role key reference in browser configuration');
if (/supabaseUrl:\s*''/.test(configText) || /supabaseAnonKey:\s*''/.test(configText)) warn('Supabase credentials are blank; production will use local preview until configured');

const publicRuntime = ['index.html','404.html','.nojekyll','manifest.webmanifest','robots.txt','assets'];
for (const entry of publicRuntime) {
  (await exists(entry)) ? ok(`Deployable runtime entry: ${entry}`) : fail(`Deployable runtime entry missing: ${entry}`);
}

console.log(`\nValidation summary: ${passes.length} passed, ${warnings.length} warning(s), ${failures.length} failure(s).`);
if (warnings.length) console.log(`Warnings:\n- ${warnings.join('\n- ')}`);
if (failures.length) {
  console.error(`Failures:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
