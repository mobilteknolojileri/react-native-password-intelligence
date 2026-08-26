/**
 * Keeps every workspace package on the root version.
 *
 * `release-it` bumps only the root `package.json` (its npm plugin runs
 * `npm version --workspaces=false`), while `release.yml` publishes
 * `packages/*` from the resulting tag. Without this step the packages would
 * stay on the previous version and `npm publish` would fail with E403, and
 * the wrapper's dependency range on the core would never advance.
 *
 *   node scripts/sync-versions.mjs            # write versions + ranges
 *   node scripts/sync-versions.mjs --check    # fail on drift (CI)
 *   node scripts/sync-versions.mjs --check --tag v1.2.3
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const DEPENDENCY_FIELDS = [
  'dependencies',
  'peerDependencies',
  'devDependencies',
];

const args = process.argv.slice(2);
const check = args.includes('--check');
const tagIndex = args.indexOf('--tag');
const tag = tagIndex >= 0 ? args[tagIndex + 1] : undefined;

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, value) =>
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const { version } = readJson(path.join(ROOT, 'package.json'));
if (typeof version !== 'string' || version.length === 0) {
  throw new Error('root package.json has no version');
}

const packageFiles = readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(PACKAGES_DIR, entry.name, 'package.json'));
const packages = packageFiles.map((file) => ({ file, json: readJson(file) }));
const workspaceNames = new Set(packages.map(({ json }) => json.name));
const expectedRange = `^${version}`;

const problems = [];

if (tag !== undefined && tag !== `v${version}`) {
  problems.push(`tag ${tag} does not match root version ${version}`);
}

for (const { file, json } of packages) {
  const relative = path.relative(ROOT, file);
  let changed = false;

  if (json.version !== version) {
    problems.push(`${relative}: version ${json.version} != ${version}`);
    json.version = version;
    changed = true;
  }

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(json[field] ?? {})) {
      if (!workspaceNames.has(name) || range === expectedRange) continue;
      problems.push(
        `${relative}: ${field}.${name} ${range} != ${expectedRange}`
      );
      json[field][name] = expectedRange;
      changed = true;
    }
  }

  if (changed && !check) writeJson(file, json);
}

if (problems.length === 0) {
  console.log(`versions in sync at ${version}`);
} else if (check) {
  console.error('version drift:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
} else {
  console.log(`synced to ${version}:`);
  for (const problem of problems) console.log(`  ${problem}`);
}
