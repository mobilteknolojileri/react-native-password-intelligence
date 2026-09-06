/**
 * Core password analysis engine.
 *
 * Wraps `@zxcvbn-ts/core` with Turkish intelligence dictionaries and exposes
 * `analyzePassword` plus an opt-in custom dictionary API. Engine configuration
 * lives in `./engine`; see `configure()` for swapping in the full
 * `@zxcvbn-ts/language-common` dictionary.
 */
import { zxcvbn } from '@zxcvbn-ts/core';

import type { ZxcvbnResult } from '../types';
import {
  applyPendingOptions,
  dictionaryWarnings,
  getCustomWords,
  maxLength,
  setCustomWords,
  MAX_CUSTOM_DICTIONARY_SIZE,
} from './engine';
import {
  expandTurkishVariants,
  mapRepairedIndices,
  repairTurkishCase,
  toNfc,
} from './turkishCase';

const hasOwn = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);

/**
 * zxcvbn leaves a dictionary match unexplained unless the dictionary happens to
 * be one of its own well-known names, so every Turkish category would otherwise
 * return `warning: null`. Fill in the gap using the longest matching token,
 * under the same rule zxcvbn applies to its own warnings: never for a password
 * that already scores 3 or 4.
 */
const withDictionaryWarning = (result: ZxcvbnResult): ZxcvbnResult => {
  if (result.score > 2 || result.feedback.warning) return result;

  const warnings = dictionaryWarnings();
  let bestWarning: string | undefined;
  let bestLength = 0;

  for (const match of result.sequence) {
    if (match.pattern !== 'dictionary') continue;
    const name = (match as { dictionaryName?: unknown }).dictionaryName;
    if (typeof name !== 'string' || !hasOwn(warnings, name)) continue;
    const length = match.token.length;
    if (length > bestLength) {
      bestLength = length;
      bestWarning = warnings[name];
    }
  }

  if (bestWarning === undefined) return result;
  return { ...result, feedback: { ...result.feedback, warning: bestWarning } };
};

/**
 * zxcvbn lowercases `userInputs` with default casing and sizes its match
 * window from the *un*-lowercased strings, so an entry containing `İ` can
 * never match. Expand strings through the shared Turkish fold instead;
 * numbers pass through untouched.
 */
const foldUserInputs = (
  userInputs: readonly (string | number)[]
): (string | number)[] => {
  const folded: (string | number)[] = [];
  for (const input of userInputs) {
    if (typeof input === 'string') {
      folded.push(...expandTurkishVariants(input));
    } else if (typeof input === 'number' && Number.isFinite(input)) {
      folded.push(input);
    }
    // Anything else is dropped rather than forwarded. zxcvbn calls `.toString()`
    // on every entry, so a `null` throws - and `usePasswordRisk` manufactures
    // exactly that out of `undefined`/`NaN` through its JSON round-trip, which
    // would take down the render tree on a keystroke.
  }
  return folded;
};

/**
 * Re-anchors matches found in the repaired string onto the original password.
 * The repair collapses `i`/`I` + U+0307 into one character, so without this
 * `password.slice(match.i, match.j + 1)` returns a shifted substring and any
 * consumer highlighting matched spans underlines the wrong characters.
 */
const realignSequence = (
  sequence: ZxcvbnResult['sequence'],
  original: string
): ZxcvbnResult['sequence'] => {
  const indices = mapRepairedIndices(original);
  if (indices === null) return sequence;

  return sequence.map((match) => {
    const start = indices[match.i];
    if (start === undefined) return match;
    // End the span just before the next repaired character begins, so that a
    // combining mark dropped after the final matched character stays inside
    // the match instead of dangling past it.
    const end = (indices[match.j + 1] ?? original.length) - 1;
    return {
      ...match,
      i: start,
      j: end,
      token: original.slice(start, end + 1),
    };
  });
};

export const analyzePassword = (
  password: string,
  userInputs?: readonly (string | number)[]
): ZxcvbnResult => {
  applyPendingOptions();

  // Compose before anything else looks at the string: NFD input reaches every
  // Turkish letter, not just the dotted capital I, and an unnormalised
  // `GUMUSHANE` scored 4 where the composed spelling scored 0. `result.password`
  // therefore echoes the NFC form of the input, which renders identically.
  const safe = toNfc(typeof password === 'string' ? password : '');

  // zxcvbn-ts is roughly O(n2) over input length; truncate to avoid blocking
  // the UI thread on pathological pastes (e.g., a leaked 50KB token).
  // Note the synchronous `zxcvbn()` never applies its own maxLength - only
  // `zxcvbnAsync` does - so this guard is load-bearing.
  const limit = maxLength();
  const truncated = safe.length > limit ? safe.slice(0, limit) : safe;

  // Always pass an array: when the argument is omitted, zxcvbn-ts leaves the
  // PREVIOUS call's rankedDictionaries.userInputs in place.
  const inputs = userInputs ? foldUserInputs(userInputs) : [];

  // Score the password as typed, so uppercase entropy and zxcvbn's
  // capitalization/allUppercase suggestions survive.
  const primary = zxcvbn(truncated, inputs);

  // A second pass runs only when default Unicode casing would miss a Turkish
  // dictionary entry (see ./turkishCase). The more pessimistic result wins;
  // `password` always echoes what was analysed, not the folded form.
  const repaired = repairTurkishCase(truncated);
  if (repaired === truncated) return withDictionaryWarning(primary);

  const alternate = zxcvbn(repaired, inputs);

  // Compare guesses, not the five-bucket score. The buckets tie constantly -
  // both passes land on 4 for `Istanbul-2024-Xq7` - and on a tie the
  // un-repaired pass wins with a crack time three to five orders of magnitude
  // too optimistic, and without the Turkish match in `sequence`.
  if (alternate.guesses >= primary.guesses) {
    return withDictionaryWarning(primary);
  }

  return withDictionaryWarning({
    ...alternate,
    password: truncated,
    sequence: realignSequence(alternate.sequence, truncated),
  });
};

/**
 * Registers global custom dictionary entries (e.g., company brand names) that
 * will be penalized in every analysis. Idempotent and bounded - additions are
 * deduped via a Set and capped at 10k entries to prevent unbounded growth in
 * long-running apps. Should typically be called once at application startup.
 *
 * Entries are registered as a real zxcvbn dictionary rather than being spread
 * into `userInputs` on every call, so a large list costs nothing per keystroke.
 * Each word is matched in its Turkish, compact and ASCII-folded forms, exactly
 * like the bundled categories.
 */
export const addCustomDictionary = (customWords: readonly string[]): void => {
  if (customWords.length === 0) return;

  // Dedupe on the folded form, not the raw string: `Acme`, `ACME` and `acme `
  // build the same dictionary entries, so counting them separately burns three
  // slots of the cap and bumps the configuration revision three times - and
  // every bump re-ranks the dictionary and re-renders each mounted consumer.
  const byFoldedForm = new Map<string, string>();
  for (const word of getCustomWords()) {
    const key = expandTurkishVariants(word)[0];
    if (key !== undefined && !byFoldedForm.has(key)) {
      byFoldedForm.set(key, word);
    }
  }

  const sizeBefore = byFoldedForm.size;
  for (const word of customWords) {
    if (typeof word !== 'string') continue;
    const key = expandTurkishVariants(word)[0];
    if (key === undefined || byFoldedForm.has(key)) continue;
    byFoldedForm.set(key, word.trim());
  }

  if (byFoldedForm.size > MAX_CUSTOM_DICTIONARY_SIZE) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[password-intelligence] Custom dictionary exceeds ${MAX_CUSTOM_DICTIONARY_SIZE} entries; additions ignored`
      );
    }
    return;
  }

  if (byFoldedForm.size === sizeBefore) return;
  setCustomWords([...byFoldedForm.values()]);
};

/**
 * Clears all entries previously registered via `addCustomDictionary`. Intended
 * primarily for test isolation and multi-tenant SSR scenarios.
 */
export const clearCustomDictionary = (): void => {
  if (getCustomWords().length === 0) return;
  setCustomWords([]);
};
