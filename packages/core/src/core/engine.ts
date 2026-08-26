/**
 * Engine state and configuration.
 *
 * zxcvbn's options live in a module-level singleton (`zxcvbnOptions`), so all
 * configuration here is module-global too. Rather than registering options
 * eagerly at import time (which would pull every dictionary into the module
 * graph) or requiring consumers to call an init function before the first
 * analysis, we keep a dirty flag: `configure()` records intent, and the next
 * `analyzePassword()` applies it synchronously. There is therefore no ordering
 * requirement on `configure()` and `analyzePassword()` stays synchronous.
 *
 * Every state change also bumps a revision counter and notifies subscribers,
 * so a memoized consumer (the React hook) can re-run an analysis whose inputs
 * did not change but whose configuration did.
 */
import {
  zxcvbnOptions,
  type OptionsDictionary,
  type OptionsGraph,
  type OptionsType,
} from '@zxcvbn-ts/core';

import { ADJACENCY_GRAPHS } from '../data/adjacencyGraphs.generated';
import { EN_COMMON_LITE } from '../data/enCommonLite.generated';
import { tr as trDict } from '../dictionaries/tr';
import { trTranslations } from '../translations/tr';
import type { PasswordIntelligenceTranslations } from '../types';
import { buildTurkishDictionary } from './turkishCase';

/**
 * Dictionaries keyed by name, each ordered by descending frequency. Typed
 * structurally rather than against `@zxcvbn-ts/language-common` so consumers do
 * not need that package installed merely to typecheck a `configure()` call.
 */
export type DictionaryInput = Readonly<
  Record<string, readonly (string | number)[]>
>;

/** Keyboard adjacency graphs, keyed by layout name. */
export type AdjacencyGraphsInput = Readonly<
  Record<string, Readonly<Record<string, readonly (string | null)[]>>>
>;

export interface PasswordIntelligenceConfig {
  /**
   * Extra zxcvbn dictionaries, merged over the bundled ones key by key.
   * Pass `dictionary` from `@zxcvbn-ts/language-common` for full 49k coverage.
   */
  readonly dictionaries?: DictionaryInput;
  /** Replaces the bundled keyboard adjacency graphs wholesale. */
  readonly graphs?: AdjacencyGraphsInput;
  /**
   * Replaces the bundled Turkish feedback strings, including the
   * per-dictionary warnings. Omit `dictionaryWarnings` to leave Turkish
   * dictionary matches unexplained (never mixed-language).
   */
  readonly translations?: PasswordIntelligenceTranslations;
  /** Omit the bundled Turkish dictionaries entirely. @default false */
  readonly disableTurkishDictionaries?: boolean;
  /** Omit the bundled lite English password list. @default false */
  readonly disableBundledPasswords?: boolean;
  /** @default false */
  readonly useLevenshteinDistance?: boolean;
  /** Non-negative integer. @default 2 */
  readonly levenshteinThreshold?: number;
  /** Positive integer: characters analysed before truncation. @default 1024 */
  readonly maxLength?: number;
}

export const DEFAULT_MAX_PASSWORD_LENGTH = 1024;
export const MAX_CUSTOM_DICTIONARY_SIZE = 10_000;

const DEFAULT_USE_LEVENSHTEIN_DISTANCE = false;
const DEFAULT_LEVENSHTEIN_THRESHOLD = 2;

/** Bundled Turkish intelligence, keyed for zxcvbn. */
const TURKISH_DICTIONARIES: Readonly<Record<string, readonly string[]>> = {
  // `firstnames` is load-bearing, not cosmetic: zxcvbn only emits a dictionary
  // warning when the name contains 'firstnames', equals 'lastnames',
  // equals 'passwords', includes 'wikipedia', or equals 'userInputs'.
  turkish_firstnames: trDict.commonNames,
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
};

let dirty = true;
let revision = 0;
let overrides: PasswordIntelligenceConfig = {};
let customWords: readonly string[] = [];
const listeners = new Set<() => void>();

const markDirty = (): void => {
  dirty = true;
  revision += 1;
  for (const listener of listeners) listener();
};

// ---------------------------------------------------------------------------
// Validation. `configure()` fails fast so a bad option can never be applied
// halfway: zxcvbn's `setOptions` installs the dictionary before it validates
// the translations, and a throw from inside `analyzePassword` would repeat on
// every keystroke.
// ---------------------------------------------------------------------------

// Deliberately not a type predicate: narrowing `config` to
// `Record<string, unknown>` would erase the declared option types below.
const isPlainObject = (value: unknown): boolean =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateConfig = (config: PasswordIntelligenceConfig): void => {
  if (!isPlainObject(config)) {
    throw new TypeError('configure() expects an options object');
  }

  const {
    dictionaries,
    graphs,
    translations,
    maxLength,
    levenshteinThreshold,
    useLevenshteinDistance,
  } = config;

  if (dictionaries !== undefined) {
    if (!isPlainObject(dictionaries)) {
      throw new TypeError('configure(): `dictionaries` must be an object');
    }
    for (const [name, list] of Object.entries(dictionaries)) {
      if (!Array.isArray(list)) {
        throw new TypeError(
          `configure(): dictionary "${name}" must be an array of words`
        );
      }
    }
  }

  if (graphs !== undefined && !isPlainObject(graphs)) {
    throw new TypeError('configure(): `graphs` must be an object');
  }

  if (
    translations !== undefined &&
    !(
      isPlainObject(translations) &&
      zxcvbnOptions.checkCustomTranslations(translations)
    )
  ) {
    throw new TypeError(
      'configure(): `translations` must contain every zxcvbn warning, suggestion and timeEstimation key'
    );
  }

  if (
    maxLength !== undefined &&
    !(Number.isInteger(maxLength) && maxLength > 0)
  ) {
    throw new RangeError('configure(): `maxLength` must be a positive integer');
  }

  if (
    levenshteinThreshold !== undefined &&
    !(Number.isInteger(levenshteinThreshold) && levenshteinThreshold >= 0)
  ) {
    throw new RangeError(
      'configure(): `levenshteinThreshold` must be a non-negative integer'
    );
  }

  if (
    useLevenshteinDistance !== undefined &&
    typeof useLevenshteinDistance !== 'boolean'
  ) {
    throw new TypeError(
      'configure(): `useLevenshteinDistance` must be boolean'
    );
  }
};

// ---------------------------------------------------------------------------
// Option assembly
// ---------------------------------------------------------------------------

const buildOptions = (): OptionsType => {
  const dictionary: Record<string, readonly (string | number)[]> = {};

  if (!overrides.disableBundledPasswords) {
    dictionary['passwords'] = EN_COMMON_LITE;
  }
  if (!overrides.disableTurkishDictionaries) {
    Object.assign(dictionary, TURKISH_DICTIONARIES);
  }
  // Consumer dictionaries override bundled ones; the custom dictionary is
  // applied last so `addCustomDictionary` entries can never be shadowed.
  Object.assign(dictionary, overrides.dictionaries ?? {});
  if (customWords.length > 0) {
    // zxcvbn lowercases the password with default Unicode casing and does NOT
    // fold regular dictionaries, so custom words get the same four-variant
    // expansion as the bundled Turkish categories (see ./turkishCase).
    dictionary['custom'] = buildTurkishDictionary(customWords);
  }

  // Every field is emitted, defaults included: `Options.setOptions` only
  // assigns the keys present, so an omitted key would keep the previous
  // value and `resetConfiguration()` could never revert it.
  return {
    translations: overrides.translations ?? trTranslations,
    graphs: (overrides.graphs ?? ADJACENCY_GRAPHS) as OptionsGraph,
    dictionary: dictionary as OptionsDictionary,
    useLevenshteinDistance:
      overrides.useLevenshteinDistance ?? DEFAULT_USE_LEVENSHTEIN_DISTANCE,
    levenshteinThreshold:
      overrides.levenshteinThreshold ?? DEFAULT_LEVENSHTEIN_THRESHOLD,
  };
};

/** Applies any pending configuration. Cheap no-op when nothing changed. */
export const applyPendingOptions = (): void => {
  if (!dirty) return;
  zxcvbnOptions.setOptions(buildOptions());
  dirty = false;
};

export const maxLength = (): number =>
  overrides.maxLength ?? DEFAULT_MAX_PASSWORD_LENGTH;

/** The per-dictionary warnings of the active translations. */
export const dictionaryWarnings = (): Readonly<Record<string, string>> =>
  (overrides.translations ?? trTranslations).dictionaryWarnings ?? {};

// ---------------------------------------------------------------------------
// Public configuration API
// ---------------------------------------------------------------------------

/**
 * Configures the engine. Valid at any time — including after the first
 * analysis — because options are re-applied lazily on the next call.
 * Repeated calls merge; `dictionaries` merges key by key, everything else
 * is last-write-wins.
 *
 * Throws synchronously (`TypeError` / `RangeError`) on an invalid option and
 * leaves the current configuration untouched.
 */
export const configure = (config: PasswordIntelligenceConfig): void => {
  validateConfig(config);
  overrides = {
    ...overrides,
    ...config,
    dictionaries: { ...overrides.dictionaries, ...config.dictionaries },
  };
  markDirty();
};

/**
 * Reverts everything set via `configure()`. Deliberately does NOT clear the
 * custom dictionary — that is `clearCustomDictionary()`'s job.
 */
export const resetConfiguration = (): void => {
  overrides = {};
  markDirty();
};

/**
 * Monotonic counter bumped by `configure`, `resetConfiguration`,
 * `addCustomDictionary` and `clearCustomDictionary`. Include it in a memo
 * key when caching `analyzePassword` results.
 */
export const getConfigurationVersion = (): number => revision;

/**
 * Notifies `listener` after every configuration change. Returns the
 * unsubscribe function. Shaped for `useSyncExternalStore`.
 */
export const subscribeToConfiguration = (
  listener: () => void
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getCustomWords = (): readonly string[] => customWords;

export const setCustomWords = (words: readonly string[]): void => {
  customWords = words;
  markDirty();
};
