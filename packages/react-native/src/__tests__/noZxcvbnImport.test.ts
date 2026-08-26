/**
 * Single-instance guard.
 *
 * `zxcvbnOptions` is a module-level singleton inside @zxcvbn-ts/core. If the
 * wrapper pulled in its own copy, `configure()` would write to one instance
 * while `analyzePassword` read from another and configuration would silently
 * do nothing. The wrapper must reach zxcvbn only through
 * `password-intelligence`. (eslint enforces this too, via no-restricted-imports.)
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SRC = path.join(__dirname, '..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`));

describe('dependency isolation', () => {
  it('never imports @zxcvbn-ts directly (static, dynamic or require)', () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      /(?:from\s+|import\(|require\()\s*['"]@zxcvbn-ts\//.test(
        readFileSync(file, 'utf8')
      )
    );
    expect(sourceFiles(SRC).length).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it('declares password-intelligence as a real dependency', () => {
    const pkg = JSON.parse(
      readFileSync(path.join(SRC, '..', 'package.json'), 'utf8')
    ) as { dependencies?: Record<string, string> };
    expect(pkg.dependencies?.['password-intelligence']).toBeDefined();
  });
});
