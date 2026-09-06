/**
 * Turns "we chose a 4000-entry cutoff" from a judgement call into a
 * CI-enforced invariant.
 *
 * The bundled English list is a frequency-ordered prefix of
 * @zxcvbn-ts/language-common (49,233 entries, ~229 kB gzip - see
 * ARCHITECTURE.md "Data provenance"). Passwords past the cutoff no longer
 * match, so a share of real leaked passwords score higher than they should.
 * This measures that share and fails if it drifts.
 *
 * The same import also carried `diceware` (7,776 words). Dropping the static
 * import dropped that list with it, and unlike `passwords` it has no lite
 * replacement: the words are equiprobable and the list is in dice order, so a
 * prefix would just be "the ones starting with a-f". Vendoring all of it costs
 * 25 kB gzip, which would blow the 40 kB budget. That regression is therefore
 * accepted rather than fixed - but it is measured here so it cannot drift
 * unnoticed, and it is written down in CHANGELOG.md.
 */
import { dictionary } from '@zxcvbn-ts/language-common';

import { analyzePassword } from '../core/analyzer';
import { configure } from '../core/engine';

const CUTOFF = 4000;
const FALSE_STRONG_BUDGET = 0.05;

describe('lite dictionary parity', () => {
  it('keeps the false-strong rate under budget', () => {
    const sample: string[] = [];
    for (let i = CUTOFF; i < dictionary.passwords.length; i += 37) {
      sample.push(String(dictionary.passwords[i]));
    }

    const strong = sample.filter(
      (word) => analyzePassword(word).score >= 3
    ).length;

    expect(sample.length).toBeGreaterThan(1000);
    expect(strong / sample.length).toBeLessThan(FALSE_STRONG_BUDGET);
  });

  it('closes the gap entirely when the full dictionary is configured', () => {
    const beyondCutoff = String(dictionary.passwords[20_000]);
    configure({ dictionaries: dictionary });
    expect(analyzePassword(beyondCutoff).score).toBeLessThanOrEqual(1);
  });

  it('pins the passphrase regression left by the dropped diceware list', () => {
    const sample: string[] = [];
    for (let i = 0; i < dictionary.diceware.length; i += 9) {
      sample.push(String(dictionary.diceware[i]));
    }

    const strong = sample.filter(
      (word) => analyzePassword(word).score >= 3
    ).length;
    const rate = strong / sample.length;

    expect(sample.length).toBeGreaterThan(800);
    // Roughly one word in five. Documented in CHANGELOG.md, not a budget we
    // are trying to meet - the assertion exists so the number cannot move
    // without someone noticing.
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.3);
  });

  it('matches everything inside the cutoff', () => {
    const inside = [0, 100, 1000, 3999].map((i) =>
      String(dictionary.passwords[i])
    );
    for (const word of inside) {
      expect(analyzePassword(word).score).toBeLessThanOrEqual(1);
    }
  });
});
