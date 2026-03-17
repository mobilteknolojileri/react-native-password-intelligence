/**
 * Core password analysis engine.
 *
 * Wraps `@zxcvbn-ts/core` with Turkish intelligence dictionaries
 * and exposes a single `analyzePassword` function.
 *
 * Initialization is lazy - dictionaries are loaded on first call,
 * not at module import time, which preserves tree-shaking.
 */
import { zxcvbn, zxcvbnOptions, type OptionsType } from '@zxcvbn-ts/core';
import { dictionary as commonDictionary } from '@zxcvbn-ts/language-common';
import {
  dictionary as enDictionary,
  translations as enTranslations,
} from '@zxcvbn-ts/language-en';

import type { ZxcvbnResult } from '../types';
import { tr as trDict } from '../dictionaries/tr';

let initialized = false;

const ensureInitialized = (): void => {
  if (initialized) return;

  const options: OptionsType = {
    translations: enTranslations,
    dictionary: {
      ...commonDictionary,
      ...enDictionary,
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
    },
  };

  zxcvbnOptions.setOptions(options);
  initialized = true;
};

export const analyzePassword = (password: string): ZxcvbnResult => {
  ensureInitialized();
  return zxcvbn(password || '');
};
