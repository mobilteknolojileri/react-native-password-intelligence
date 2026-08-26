/**
 * Generates the vendored data modules that let this package ship a useful
 * default dictionary without depending on @zxcvbn-ts/language-common at
 * runtime (that package is ~229 kB gzip; see ARCHITECTURE.md "Data provenance").
 *
 * Run: yarn workspace password-intelligence run generate:data
 * CI enforces that the checked-in output matches, via `yarn verify:data`.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { dictionary, adjacencyGraphs } = require('@zxcvbn-ts/language-common');
const { version } = require('@zxcvbn-ts/language-common/package.json');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'src', 'data');

/**
 * Frequency-ordered cutoff for the bundled English password list.
 *
 * Measured false-strong rate (share of leaked passwords beyond the cutoff that
 * still score >= 3): N=1000 -> 4.7%, N=2000 -> 4.3%, N=3000 -> 3.8%,
 * N=4000 -> 3.5%, N=5000 -> 3.5%, N=10000 -> 3.0%, full 49233 -> 0%.
 * The curve is flat past ~3000; 4000 sits at the knee at ~16 kB gzip.
 * `dictionaryParity.test.ts` enforces the rate stays under 5%.
 */
const PASSWORD_CUTOFF = 4000;

const header = (what) => `/* eslint-disable */
// prettier-ignore-start
//
// GENERATED FILE - DO NOT EDIT.
// Regenerate with: yarn workspace password-intelligence run generate:data
//
// ${what}
// Source: @zxcvbn-ts/language-common@${version} (MIT)
//   https://github.com/zxcvbn-ts/zxcvbn
// Derived from dropbox/zxcvbn (MIT, Copyright (c) 2012 Dropbox, Inc.),
// whose frequency lists derive from public breach-corpus analyses.
// Full license texts: see THIRD_PARTY_NOTICES.md in this package.
//
`;

// Rank order IS the scoring signal - never sort.
const passwords = dictionary.passwords.slice(0, PASSWORD_CUTOFF);
if (passwords.length !== PASSWORD_CUTOFF) {
  throw new Error(
    `Expected ${PASSWORD_CUTOFF} passwords, got ${passwords.length}`
  );
}

const passwordsFile = [
  header(
    `Top ${PASSWORD_CUTOFF} most common passwords, in descending frequency order.`
  ),
  '',
  'export const EN_COMMON_LITE: readonly string[] = [',
  ...passwords.map((w) => `  ${JSON.stringify(String(w))},`),
  '];',
  '// prettier-ignore-end',
  '',
].join('\n');

const graphsFile = [
  header(
    'Keyboard adjacency graphs for the spatial matcher (qwerty, qwertz, azerty, dvorak, keypad, keypadMac).'
  ),
  '',
  '// Structurally typed on purpose: `as const` here would produce a literal',
  '// type with thousands of members and make tsc crawl.',
  'export const ADJACENCY_GRAPHS: Record<',
  '  string,',
  '  Record<string, (string | null)[]>',
  `> = ${JSON.stringify(adjacencyGraphs, null, 2)};`,
  '// prettier-ignore-end',
  '',
].join('\n');

writeFileSync(path.join(OUT_DIR, 'enCommonLite.generated.ts'), passwordsFile);
writeFileSync(path.join(OUT_DIR, 'adjacencyGraphs.generated.ts'), graphsFile);

console.log(
  `Wrote enCommonLite.generated.ts (${passwords.length} entries) and ` +
    `adjacencyGraphs.generated.ts (${Object.keys(adjacencyGraphs).length} layouts)`
);
