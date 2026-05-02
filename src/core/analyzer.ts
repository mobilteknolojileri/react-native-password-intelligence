/**
 * Core password analysis engine.
 *
 * Wraps `@zxcvbn-ts/core` with Turkish intelligence dictionaries and exposes
 * a single `analyzePassword` function plus an opt-in custom dictionary API.
 *
 * Initialization is deferred to the first `analyzePassword` call (zxcvbn
 * options setup). Note: dictionary arrays themselves are eagerly built at
 * module import time; "lazy" only refers to zxcvbn options registration.
 */
import { zxcvbn, zxcvbnOptions, type OptionsType } from '@zxcvbn-ts/core';
import { dictionary as commonDictionary } from '@zxcvbn-ts/language-common';

import { trTranslations } from '../translations/tr';
import type { ZxcvbnResult } from '../types';
import { tr as trDict } from '../dictionaries/tr';

let initialized = false;

let customDictionary: ReadonlySet<string> = new Set<string>();

const MAX_CUSTOM_DICTIONARY_SIZE = 10_000;
const MAX_PASSWORD_LENGTH = 1024;

const ensureInitialized = (): void => {
  if (initialized) return;

  const options: OptionsType = {
    translations: trTranslations,
    dictionary: {
      ...commonDictionary,
      turkish_names: trDict.commonNames,
      turkish_surnames: trDict.commonSurnames,
      turkish_teams: trDict.footballTeams,
      turkish_cities: trDict.cityNames,
      turkish_plate_patterns: trDict.platePatterns,
      turkish_cultural: trDict.culturalKeywords,
      turkish_keyboard: trDict.keyboardWalks,
      turkish_romantic: trDict.romanticTerms,
      turkish_religious: trDict.religiousNationalistic,
      turkish_common: trDict.commonPasswords,
      turkish_zodiac: trDict.zodiacSigns,
      turkish_brands: trDict.brands,
    },
  };

  zxcvbnOptions.setOptions(options);
  initialized = true;
};

export const analyzePassword = (
  password: string,
  userInputs?: readonly (string | number)[]
): ZxcvbnResult => {
  ensureInitialized();

  const safe = typeof password === 'string' ? password : '';

  // zxcvbn-ts is roughly O(n²) over input length; truncate to avoid blocking
  // the UI thread on pathological pastes (e.g., a leaked 50KB token).
  const truncated =
    safe.length > MAX_PASSWORD_LENGTH
      ? safe.slice(0, MAX_PASSWORD_LENGTH)
      : safe;

  const mergedUserInputs: (string | number)[] = [
    ...customDictionary,
    ...(userInputs ?? []),
  ];

  // Two case-foldings catch different real-world inputs:
  //   - standard `toLowerCase` matches English-keyboard typings ("IBRAHIM" → "ibrahim")
  //   - `toLocaleLowerCase('tr-TR')` matches Turkish-keyboard typings ("İSTANBUL" → "istanbul")
  // We run both and return the more pessimistic (lower-scoring) result so users
  // typing on either layout get flagged correctly. The two paths only diverge
  // when the input contains uppercase 'I' or 'İ', so the cost is paid rarely.
  const standardForm = truncated.toLowerCase();
  const turkishForm = truncated.toLocaleLowerCase('tr-TR');

  const standardResult = zxcvbn(standardForm, mergedUserInputs);
  if (standardForm === turkishForm) return standardResult;

  const turkishResult = zxcvbn(turkishForm, mergedUserInputs);
  return turkishResult.score < standardResult.score
    ? turkishResult
    : standardResult;
};

/**
 * Registers global custom dictionary entries (e.g., company brand names) that
 * will be penalized in every analysis. Idempotent and bounded — additions are
 * deduped via a Set and capped at 10k entries to prevent unbounded growth in
 * long-running apps. Should typically be called once at application startup.
 */
export const addCustomDictionary = (customWords: readonly string[]): void => {
  if (customWords.length === 0) return;

  const merged = new Set<string>(customDictionary);
  for (const word of customWords) {
    if (typeof word === 'string' && word.length > 0) {
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

  customDictionary = merged;
};

/**
 * Clears all entries previously registered via `addCustomDictionary`. Intended
 * primarily for test isolation and multi-tenant SSR scenarios.
 */
export const clearCustomDictionary = (): void => {
  customDictionary = new Set<string>();
};
