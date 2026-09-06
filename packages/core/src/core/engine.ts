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
  /**
   * Extra keyboard adjacency graphs, merged over the bundled ones layout by
   * layout - so registering a single custom layout does not disable spatial
   * matching for QWERTY and the rest.
   */
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
  /** Positive integer: characters analysed before truncation. @default 256 */
  readonly maxLength?: number;
}

// Matches `@zxcvbn-ts/core`'s own default. The cap is a ceiling on the
// quadratic matcher, not a fast path: at 256 characters a single analysis
// still costs on the order of a second on a desktop.
export const DEFAULT_MAX_PASSWORD_LENGTH = 256;
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

interface EngineState {
  dirty: boolean;
  revision: number;
  overrides: PasswordIntelligenceConfig;
  customWords: readonly string[];
  readonly listeners: Set<() => void>;
  /** The exact options object last handed to zxcvbn, for foreign-write detection. */
  installedOptions: OptionsType | null;
}

/**
 * The state lives on `globalThis`, not in module scope, because it shadows a
 * singleton that is genuinely global. This package ships CJS and ESM builds,
 * and a bundler resolving `import` to one and `require` to the other loads
 * BOTH into the same realm - two module instances, two copies of `dirty` and
 * `customWords`, one shared `zxcvbnOptions`. The second instance would then
 * reinstall its own options and silently discard the first one's custom
 * dictionary. A `Symbol.for` key makes the two instances share one state.
 */
const STATE_KEY = Symbol.for('password-intelligence.engineState');
const globalScope = globalThis as unknown as Record<
  symbol,
  EngineState | undefined
>;

const state: EngineState = (globalScope[STATE_KEY] ??= {
  dirty: true,
  revision: 0,
  overrides: {},
  customWords: [],
  listeners: new Set<() => void>(),
  installedOptions: null,
});

const markDirty = (): void => {
  state.dirty = true;
  state.revision += 1;
  for (const listener of state.listeners) listener();
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
    disableTurkishDictionaries,
    disableBundledPasswords,
  } = config;

  for (const [name, value] of [
    ['disableTurkishDictionaries', disableTurkishDictionaries],
    ['disableBundledPasswords', disableBundledPasswords],
  ] as const) {
    if (value !== undefined && typeof value !== 'boolean') {
      throw new TypeError(`configure(): \`${name}\` must be boolean`);
    }
  }

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
      // Element types matter as much as the container: zxcvbn calls
      // `.toString()` on every entry while ranking, so a single `null` from a
      // fetched blocklist would throw inside `analyzePassword` on every call
      // from then on, with no way back except `resetConfiguration()`.
      for (const [index, word] of list.entries()) {
        if (typeof word !== 'string' && typeof word !== 'number') {
          throw new TypeError(
            `configure(): dictionary "${name}" entry ${index} must be a string or number`
          );
        }
      }
    }
  }

  if (graphs !== undefined) {
    if (!isPlainObject(graphs)) {
      throw new TypeError('configure(): `graphs` must be an object');
    }
    // Same reasoning as the dictionary check: the spatial matcher indexes into
    // these at analysis time, so a malformed layout would throw on every call
    // rather than here.
    for (const [layout, keys] of Object.entries(graphs)) {
      if (!isPlainObject(keys)) {
        throw new TypeError(
          `configure(): graph "${layout}" must map each key to its adjacent keys`
        );
      }
      for (const [key, adjacent] of Object.entries(keys)) {
        if (!Array.isArray(adjacent)) {
          throw new TypeError(
            `configure(): graph "${layout}" key "${key}" must be an array of adjacent keys`
          );
        }
        // The spatial matcher calls `.indexOf()` on each entry, so a number or
        // an object gets past an Array.isArray check and throws at analysis
        // time instead. `null` is meaningful: it marks an empty slot.
        for (const [index, neighbour] of adjacent.entries()) {
          if (neighbour !== null && typeof neighbour !== 'string') {
            throw new TypeError(
              `configure(): graph "${layout}" key "${key}" entry ${index} must be a string or null`
            );
          }
        }
      }
    }
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

/**
 * zxcvbn's own defaults for the two fields this library never overrides.
 * Captured at import time because `@zxcvbn-ts/core` does not export them, and
 * re-emitted on every apply so `resetConfiguration()` can actually revert a
 * foreign `setOptions({ l33tTable })` write.
 */
const DEFAULT_L33T_TABLE = zxcvbnOptions.l33tTable;
const DEFAULT_L33T_MAX_SUBSTITUTIONS = 100;

/**
 * zxcvbn matches dictionary entries verbatim against a default-lowercased
 * password and does not fold them itself, so a consumer entry written
 * `AcmeHolding` would match nothing at all. Consumer dictionaries therefore go
 * through the same expansion as the bundled categories. Plain ASCII words
 * yield exactly one variant, so frequency ranking is preserved.
 */
const foldDictionary = (words: readonly (string | number)[]): string[] =>
  buildTurkishDictionary(words.map((word) => String(word)));

const buildOptions = (): OptionsType => {
  const dictionary: Record<string, readonly (string | number)[]> = {};

  if (!state.overrides.disableBundledPasswords) {
    dictionary['passwords'] = EN_COMMON_LITE;
  }
  if (!state.overrides.disableTurkishDictionaries) {
    Object.assign(dictionary, TURKISH_DICTIONARIES);
  }
  // Consumer dictionaries override bundled ones; the custom dictionary is
  // applied last so `addCustomDictionary` entries can never be shadowed.
  for (const [name, words] of Object.entries(
    state.overrides.dictionaries ?? {}
  )) {
    dictionary[name] = foldDictionary(words);
  }
  if (state.customWords.length > 0) {
    // zxcvbn lowercases the password with default Unicode casing and does NOT
    // fold regular dictionaries, so custom words get the same four-variant
    // expansion as the bundled Turkish categories (see ./turkishCase).
    dictionary['custom'] = buildTurkishDictionary(state.customWords);
  }

  // Every field is emitted, defaults included: `Options.setOptions` only
  // assigns the keys present, so an omitted key would keep the previous
  // value and `resetConfiguration()` could never revert it.
  return {
    translations: state.overrides.translations ?? trTranslations,
    // Merged, not replaced: adding one layout must not disable the other six.
    graphs: { ...ADJACENCY_GRAPHS, ...state.overrides.graphs } as OptionsGraph,
    dictionary: dictionary as OptionsDictionary,
    l33tTable: DEFAULT_L33T_TABLE,
    l33tMaxSubstitutions: DEFAULT_L33T_MAX_SUBSTITUTIONS,
    // Kept in sync with our own truncation so the two limits cannot disagree,
    // and so anything routed through `zxcvbnAsync` truncates identically.
    maxLength: state.overrides.maxLength ?? DEFAULT_MAX_PASSWORD_LENGTH,
    useLevenshteinDistance:
      state.overrides.useLevenshteinDistance ??
      DEFAULT_USE_LEVENSHTEIN_DISTANCE,
    levenshteinThreshold:
      state.overrides.levenshteinThreshold ?? DEFAULT_LEVENSHTEIN_THRESHOLD,
  };
};

/** Applies any pending configuration. Cheap no-op when nothing changed. */
/**
 * True when the singleton still holds exactly what we last installed. Our dirty
 * flag records our own intent, not the singleton's actual state, so without
 * this an application-level `zxcvbnOptions.setOptions()` would stick forever.
 * Reference equality is enough: `setOptions` assigns the objects it is given.
 */
const singletonMatchesInstalled = (): boolean => {
  const installed = state.installedOptions;
  if (installed === null) return false;
  return (
    zxcvbnOptions.dictionary === installed.dictionary &&
    zxcvbnOptions.translations === installed.translations &&
    zxcvbnOptions.graphs === installed.graphs &&
    zxcvbnOptions.l33tTable === installed.l33tTable &&
    zxcvbnOptions.l33tMaxSubstitutions === installed.l33tMaxSubstitutions &&
    zxcvbnOptions.maxLength === installed.maxLength &&
    zxcvbnOptions.useLevenshteinDistance === installed.useLevenshteinDistance &&
    zxcvbnOptions.levenshteinThreshold === installed.levenshteinThreshold
  );
};

export const applyPendingOptions = (): void => {
  if (!state.dirty && singletonMatchesInstalled()) return;

  const options = buildOptions();
  zxcvbnOptions.setOptions(options);
  state.installedOptions = options;
  state.dirty = false;
};

export const maxLength = (): number =>
  state.overrides.maxLength ?? DEFAULT_MAX_PASSWORD_LENGTH;

/** The per-dictionary warnings of the active translations. */
export const dictionaryWarnings = (): Readonly<Record<string, string>> =>
  (state.overrides.translations ?? trTranslations).dictionaryWarnings ?? {};

// ---------------------------------------------------------------------------
// Public configuration API
// ---------------------------------------------------------------------------

/**
 * Configures the engine. Valid at any time — including after the first
 * analysis — because options are re-applied lazily on the next call.
 * Repeated calls merge; `dictionaries` and `graphs` merge key by key,
 * everything else is last-write-wins. A key set to `undefined` is ignored
 * rather than reset — use `resetConfiguration()` to revert.
 *
 * Throws synchronously (`TypeError` / `RangeError`) on an invalid option and
 * leaves the current configuration untouched.
 */
export const configure = (config: PasswordIntelligenceConfig): void => {
  validateConfig(config);

  // An explicitly-undefined key means "leave this alone", not "reset to the
  // default". The realistic call shape is `configure({ maxLength: props.max })`
  // where the prop is optional, and silently widening a limit that way is a
  // security footgun. `resetConfiguration()` is how you revert.
  const merged: Record<string, unknown> = { ...state.overrides };
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) merged[key] = value;
  }
  merged['dictionaries'] = {
    ...state.overrides.dictionaries,
    ...config.dictionaries,
  };
  merged['graphs'] = { ...state.overrides.graphs, ...config.graphs };

  state.overrides = merged as PasswordIntelligenceConfig;
  markDirty();
};

/**
 * Reverts everything set via `configure()`. Deliberately does NOT clear the
 * custom dictionary — that is `clearCustomDictionary()`'s job.
 */
export const resetConfiguration = (): void => {
  state.overrides = {};
  markDirty();
};

/**
 * Monotonic counter bumped by `configure`, `resetConfiguration`,
 * `addCustomDictionary` and `clearCustomDictionary`. Include it in a memo
 * key when caching `analyzePassword` results.
 */
export const getConfigurationVersion = (): number => state.revision;

/**
 * Notifies `listener` after every configuration change. Returns the
 * unsubscribe function. Shaped for `useSyncExternalStore`.
 */
export const subscribeToConfiguration = (
  listener: () => void
): (() => void) => {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
};

export const getCustomWords = (): readonly string[] => state.customWords;

export const setCustomWords = (words: readonly string[]): void => {
  state.customWords = words;
  markDirty();
};
