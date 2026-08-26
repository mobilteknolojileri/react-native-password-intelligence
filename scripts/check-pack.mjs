/**
 * Asserts that what npm would actually publish contains every file the
 * package manifest points at. A broken `files`/`exports` combination is
 * invisible locally (the workspace symlink resolves to src) and only surfaces
 * after publish, which is exactly when it is most expensive.
 *
 * The expected file set is derived from the manifest itself (`main`,
 * `module`, `types`, every `exports` target) so this check cannot drift from
 * what consumers resolve.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PACKAGES = ['packages/core', 'packages/react-native'];

/** bob emits a `{"type": ...}` marker next to each output format. */
const FORMAT_MARKERS = ['lib/commonjs/package.json', 'lib/module/package.json'];

const EXTRA = {
  'password-intelligence': ['THIRD_PARTY_NOTICES.md'],
};

const collectTargets = (value, out = new Set()) => {
  if (typeof value === 'string') {
    if (value.startsWith('./lib/')) out.add(value.slice(2));
  } else if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectTargets(nested, out);
  }
  return out;
};

const expectedFiles = (pkg) => {
  const targets = collectTargets([
    pkg.main,
    pkg.module,
    pkg.types,
    pkg.exports,
  ]);
  return [
    'package.json',
    ...FORMAT_MARKERS,
    ...targets,
    ...(EXTRA[pkg.name] ?? []),
  ];
};

let failed = false;

for (const dir of PACKAGES) {
  const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const raw = execFileSync(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd: dir, encoding: 'utf8', shell: process.platform === 'win32' }
  );
  // npm can emit notices before the JSON payload; take the array only.
  const [meta] = JSON.parse(raw.slice(raw.indexOf('[')));
  const files = new Set(meta.files.map((f) => f.path.replaceAll('\\', '/')));

  const missing = expectedFiles(pkg).filter((f) => !files.has(f));

  console.log(
    `${meta.name}@${meta.version} — ${files.size} files, ${(meta.unpackedSize / 1024).toFixed(0)} kB unpacked`
  );
  if (missing.length > 0) {
    console.error(`  MISSING: ${missing.join(', ')}`);
    failed = true;
  } else {
    console.log('  every manifest entry point is present');
  }

  // The tarball must never contain tests or the generator's dev-only inputs.
  const leaked = [...files].filter((f) => /__tests__|[.]test[.]/.test(f));
  if (leaked.length > 0) {
    console.error(`  LEAKED: ${leaked.join(', ')}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
