/**
 * Shared TypeScript interfaces for react-native-password-intelligence.
 */
import type { ZxcvbnResult } from '@zxcvbn-ts/core';

/**
 * Zxcvbn-ts expects dictionaries as arrays of strings/numbers, ordered by frequency
 * (most common first). It internally converts these into ranked dictionaries.
 */
export type DictionaryArray = string[];

/** Shape of the Turkish intelligence dataset in `dictionaries/tr.ts`. */
export interface TurkishDictionary {
  commonNames: DictionaryArray;
  commonSurnames: DictionaryArray;
  footballTeams: DictionaryArray;
  cityNames: DictionaryArray;
  platePatterns: DictionaryArray;
  keyboardWalks: DictionaryArray;
  culturalKeywords: DictionaryArray;
  romanticTerms: DictionaryArray;
  religiousNationalistic: DictionaryArray;
  commonPasswords: DictionaryArray;
}

/** Zxcvbn score on a 0-4 discrete scale. */
export type PasswordScore = 0 | 1 | 2 | 3 | 4;

/** Return value of the `usePasswordRisk` hook. */
export interface PasswordRiskResult {
  /** 0-4 score where 0 = very weak, 4 = very strong. */
  score: PasswordScore;
  /** Human-readable feedback (warning + suggestions). */
  feedback: ZxcvbnResult['feedback'];
  /** Estimated online crack time at 10 guesses/second. */
  crackTimeDisplay: string;
  /** Full zxcvbn-ts result for advanced consumers. */
  raw: ZxcvbnResult;
}

export type { ZxcvbnResult };
