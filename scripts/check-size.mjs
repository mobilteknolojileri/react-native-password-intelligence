/**
 * Gzip budget for the core package's shipped ESM output.
 *
 * The whole point of 0.4.0 was dropping the unconditional
 * @zxcvbn-ts/language-common import (229 kB gzip). Without a hard gate that
 * win erodes silently the first time someone adds a dictionary category.
 */
import { Buffer } from 'node:buffer';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 40;
const DIR = path.join('packages', 'core', 'lib', 'module');

const files = readdirSync(DIR, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name))
  .sort();
if (files.length === 0) throw new Error(`No build output in ${DIR}`);

const combined = gzipSync(Buffer.concat(files.map((f) => readFileSync(f))));
const kb = combined.length / 1024;

for (const file of files) {
  const size = gzipSync(readFileSync(file)).length / 1024;
  console.log(`  ${path.relative(DIR, file).padEnd(40)} ${size.toFixed(1)} kB`);
}
console.log(
  `\nTotal (gzip, combined): ${kb.toFixed(1)} kB / ${BUDGET_KB} kB budget`
);

if (kb > BUDGET_KB) {
  console.error(
    `\nFAIL: core bundle is ${kb.toFixed(1)} kB, over the ${BUDGET_KB} kB budget.`
  );
  process.exit(1);
}
console.log('OK');
