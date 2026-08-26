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
import { expandTurkishVariants, repairTurkishCase } from './turkishCase';

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
    } else {
      folded.push(input);
    }
  }
  return folded;
};

export const analyzePassword = (
  password: string,
  userInputs?: readonly (string | number)[]
): ZxcvbnResult => {
  applyPendingOptions();

  const safe = typeof password === 'string' ? password : '';

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
  return withDictionaryWarning(
    alternate.score < primary.score
      ? { ...alternate, password: truncated }
      : primary
  );
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

  const merged = new Set<string>(getCustomWords());
  for (const word of customWords) {
    if (typeof word === 'string' && word.trim().length > 0) {
      merged.add(word);
    }
  }

  if (merged.size > MAX_CUSTOM_DICTIONARY_SIZE) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[password-intelligence] Custom dictionary exceeds ${MAX_CUSTOM_DICTIONARY_SIZE} entries; additions ignored`
      );
    }
    return;
  }

  if (merged.size === getCustomWords().length) return;
  setCustomWords([...merged]);
};

/**
 * Clears all entries previously registered via `addCustomDictionary`. Intended
 * primarily for test isolation and multi-tenant SSR scenarios.
 */
export const clearCustomDictionary = (): void => {
  if (getCustomWords().length === 0) return;
  setCustomWords([]);
};
