import { zxcvbnOptions } from '@zxcvbn-ts/core';

import {
  addCustomDictionary,
  analyzePassword,
  clearCustomDictionary,
} from '../core/analyzer';
import {
  configure,
  getConfigurationVersion,
  resetConfiguration,
  subscribeToConfiguration,
} from '../core/engine';
import { trTranslations } from '../translations/tr';

const dictionaryNames = (password: string) =>
  analyzePassword(password)
    .sequence.filter((match) => match.pattern === 'dictionary')
    .map((match) => (match as { dictionaryName?: string }).dictionaryName);

describe('configure', () => {
  it('applies configuration requested after the first analysis', () => {
    // The dirty-flag model means there is no "call configure() first" trap.
    const before = analyzePassword('trustno1').guesses;
    configure({ dictionaries: { extra: ['trustno1'] } });
    expect(analyzePassword('trustno1').guesses).toBeLessThan(before);
  });

  it('merges dictionaries key by key across repeated calls', () => {
    configure({ dictionaries: { alpha: ['zzzalpha'] } });
    configure({ dictionaries: { beta: ['zzzbeta'] } });
    expect(dictionaryNames('zzzalpha')).toContain('alpha');
    expect(dictionaryNames('zzzbeta')).toContain('beta');
  });

  it('resetConfiguration reverts overrides but keeps the custom dictionary', () => {
    addCustomDictionary(['ZzzCustomBrand']);
    configure({ dictionaries: { extra: ['zzzextra'] } });
    resetConfiguration();

    expect(dictionaryNames('zzzcustombrand')).toContain('custom');
    expect(dictionaryNames('zzzextra')).not.toContain('extra');
  });

  it('resetConfiguration reverts the Levenshtein options on the zxcvbn singleton', () => {
    // `Options.setOptions` only assigns the keys it is given, so an omitted
    // key would silently keep the previous value.
    configure({ useLevenshteinDistance: true, levenshteinThreshold: 5 });
    analyzePassword('x');
    expect(zxcvbnOptions.useLevenshteinDistance).toBe(true);
    expect(zxcvbnOptions.levenshteinThreshold).toBe(5);

    resetConfiguration();
    analyzePassword('x');
    expect(zxcvbnOptions.useLevenshteinDistance).toBe(false);
    expect(zxcvbnOptions.levenshteinThreshold).toBe(2);
  });

  it('honours disableBundledPasswords', () => {
    const before = analyzePassword('monkey123').guesses;
    configure({ disableBundledPasswords: true });
    expect(analyzePassword('monkey123').guesses).toBeGreaterThan(before);
  });

  it('honours a custom maxLength', () => {
    configure({ maxLength: 8 });
    // Everything past the limit is discarded, so the trailing entropy is lost.
    expect(analyzePassword('password' + 'Xq7#Zm2!'.repeat(4)).score).toBe(0);
  });

  describe('validation', () => {
    it.each([
      [{ maxLength: 0 }, RangeError],
      [{ maxLength: -3 }, RangeError],
      [{ maxLength: Number.NaN }, RangeError],
      [{ maxLength: 1.5 }, RangeError],
      [{ levenshteinThreshold: -1 }, RangeError],
      [{ useLevenshteinDistance: 'yes' }, TypeError],
      [{ dictionaries: { bad: 'not-an-array' } }, TypeError],
      [{ dictionaries: ['not-an-object'] }, TypeError],
      [{ graphs: 'qwerty' }, TypeError],
      [{ translations: { warnings: { topTen: 'x' } } }, TypeError],
    ])('rejects %j synchronously', (config, error) => {
      expect(() => configure(config as never)).toThrow(error);
    });

    it('rejects a non-object argument', () => {
      expect(() => configure(undefined as never)).toThrow(TypeError);
    });

    it('leaves the previous configuration intact after a rejected call', () => {
      configure({ dictionaries: { extra: ['zzzextra'] } });
      analyzePassword('x');
      const version = getConfigurationVersion();

      expect(() =>
        configure({ translations: { warnings: {} } as never })
      ).toThrow(TypeError);

      // Nothing was applied halfway: the next analysis neither throws nor
      // loses the dictionary configured before the bad call.
      expect(getConfigurationVersion()).toBe(version);
      expect(dictionaryNames('zzzextra')).toContain('extra');
    });
  });

  describe('translations', () => {
    const englishWithoutDictionaryWarnings = {
      warnings: Object.fromEntries(
        Object.keys(trTranslations.warnings).map((key) => [key, `EN:${key}`])
      ) as typeof trTranslations.warnings,
      suggestions: trTranslations.suggestions,
      timeEstimation: trTranslations.timeEstimation,
    };
    const english = {
      ...englishWithoutDictionaryWarnings,
      dictionaryWarnings: { turkish_teams: 'EN:teams' },
    };

    it('swaps zxcvbn warnings and dictionary warnings together', () => {
      configure({ translations: english });
      expect(analyzePassword('123456').feedback.warning).toBe('EN:topTen');
      expect(analyzePassword('galatasaray').feedback.warning).toBe('EN:teams');
    });

    it('never mixes languages when dictionaryWarnings are omitted', () => {
      configure({ translations: englishWithoutDictionaryWarnings });
      expect(analyzePassword('galatasaray').feedback.warning).toBeNull();
    });
  });

  describe('change notifications', () => {
    it('bumps the version and notifies subscribers on every state change', () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToConfiguration(listener);
      const start = getConfigurationVersion();

      configure({ maxLength: 64 });
      addCustomDictionary(['AcmeCorp']);
      clearCustomDictionary();
      resetConfiguration();

      expect(listener).toHaveBeenCalledTimes(4);
      expect(getConfigurationVersion()).toBe(start + 4);

      unsubscribe();
      configure({ maxLength: 32 });
      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('does not notify for no-op dictionary changes', () => {
      const listener = jest.fn();
      const unsubscribe = subscribeToConfiguration(listener);

      clearCustomDictionary(); // already empty
      addCustomDictionary([]);
      addCustomDictionary(['AcmeCorp']);
      addCustomDictionary(['AcmeCorp']); // already present

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });

  describe('custom dictionary', () => {
    it('registers custom words as a named dictionary, not userInputs', () => {
      addCustomDictionary(['SomeRandomStartup']);
      const names = dictionaryNames('somerandomstartup');
      expect(names).toContain('custom');
      expect(names).not.toContain('userInputs');
    });

    it('does not re-register options on every analysis', () => {
      // Structural guard for the perf fix: 0.3.0 re-spread up to 10k entries
      // into userInputs on every keystroke.
      const spy = jest.spyOn(zxcvbnOptions, 'setOptions');
      addCustomDictionary(['AcmeCorp']);
      analyzePassword('AcmeCorp1');
      analyzePassword('AcmeCorp2');
      analyzePassword('AcmeCorp3');
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});
