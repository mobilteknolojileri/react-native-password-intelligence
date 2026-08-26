/**
 * Turkish case folding — the single source of truth for both sides of a
 * dictionary match.
 *
 * zxcvbn lowercases the password with `String.prototype.toLowerCase()`
 * (Unicode default casing) and matches the result against dictionary entries
 * verbatim. Two Turkish letters break under default casing:
 *
 * - dotted capital `İ` (U+0130) becomes `i` + U+0307 (combining dot above),
 *   which matches nothing;
 * - ASCII capital `I` becomes dotted `i`, whereas Turkish expects dotless `ı`,
 *   so `IŞIK` lowercases to `işik` while the dictionary holds `ışık`/`isik`.
 *
 * Rather than lowercasing with `toLocaleLowerCase('tr-TR')` (engine-dependent,
 * and it destroys the case profile zxcvbn uses for capitalization feedback),
 * every dictionary entry is emitted in four variants — Turkish, compact,
 * ASCII-folded, compact ASCII — and the password is ASCII-folded *only* when
 * default casing would otherwise miss. Both directions go through the helpers
 * below, so a custom word, a per-call `userInputs` entry and a bundled entry
 * can never disagree on what "the same word" means.
 */

const ASCII_MAP: Readonly<Record<string, string>> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  Ç: 'C',
  Ğ: 'G',
  İ: 'I',
  Ö: 'O',
  Ş: 'S',
  Ü: 'U',
};

const TURKISH_LETTER = /[çğıöşüÇĞİÖŞÜ]/;
const DOTTED_CAPITAL_I = /\u0130/g;
const ASCII_CAPITAL_I = /I/g;
const I_WITH_COMBINING_DOT = /i\u0307/g;
const COMPACT_PATTERN = /[\s'"‘’“”.\-–— ]+/g;

/**
 * Locale-independent Turkish lowercasing: `I` -> `ı`, `İ` -> `i`, everything
 * else via default casing. Identical to `toLocaleLowerCase('tr-TR')` for the
 * letters that differ, without depending on the engine's ICU data.
 */
export const lowerTurkish = (value: string): string =>
  value
    .replace(ASCII_CAPITAL_I, 'ı')
    .replace(DOTTED_CAPITAL_I, 'i')
    .toLowerCase()
    .replace(I_WITH_COMBINING_DOT, 'i');

/** Replaces every Turkish-specific letter with its ASCII counterpart. */
export const toAsciiTurkish = (value: string): string =>
  TURKISH_LETTER.test(value)
    ? Array.from(value, (char) => ASCII_MAP[char] ?? char).join('')
    : value;

/** Strips whitespace, quotes and dashes so `Ömer Asaf` also yields `ömerasaf`. */
export const compact = (value: string): string =>
  value.replace(COMPACT_PATTERN, '');

/**
 * The four match variants of a dictionary word (Turkish, compact, ASCII,
 * compact ASCII), deduplicated and in that order. Returns `[]` for blank input.
 */
export const expandTurkishVariants = (word: string): string[] => {
  const base = lowerTurkish(word.trim());
  if (base === '') return [];

  const ascii = toAsciiTurkish(base);
  const variants: string[] = [];
  for (const candidate of [base, compact(base), ascii, compact(ascii)]) {
    if (candidate !== '' && !variants.includes(candidate)) {
      variants.push(candidate);
    }
  }
  return variants;
};

/**
 * Builds a zxcvbn dictionary from raw source words: every word contributes its
 * variants, duplicates are dropped while preserving first-seen order (which is
 * what zxcvbn ranks by).
 */
export const buildTurkishDictionary = (words: Iterable<string>): string[] => {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    for (const variant of expandTurkishVariants(word)) {
      if (!seen.has(variant)) {
        seen.add(variant);
        output.push(variant);
      }
    }
  }
  return output;
};

const NEEDS_DOTTED_REPAIR = /\u0130|i\u0307/;
const HAS_ASCII_CAPITAL_I = /I/;

/**
 * Returns the password rewritten so that zxcvbn's default-casing lowercase
 * lands on a dictionary variant, or the input unchanged when default casing
 * already does the right thing.
 *
 * The rewrite keeps every character's case, so uppercase entropy and zxcvbn's
 * `capitalization` / `allUppercase` feedback survive. It is only applied when
 * the input contains a dotted `İ` (always mis-cased) or an ASCII capital `I`
 * alongside another Turkish letter (`ŞANLIURFA` -> `şanliurfa` matches neither
 * `şanlıurfa` nor `sanliurfa`; folded to `SANLIURFA` it matches the latter).
 * Pure-ASCII input is never touched, so the extra analysis pass is rare.
 */
export const repairTurkishCase = (value: string): string => {
  const needsRepair =
    NEEDS_DOTTED_REPAIR.test(value) ||
    (HAS_ASCII_CAPITAL_I.test(value) && TURKISH_LETTER.test(value));
  if (!needsRepair) return value;
  return toAsciiTurkish(value.replace(I_WITH_COMBINING_DOT, 'i'));
};
