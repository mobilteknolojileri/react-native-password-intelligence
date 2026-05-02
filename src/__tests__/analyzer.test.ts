import {
  analyzePassword,
  addCustomDictionary,
  clearCustomDictionary,
} from '../core/analyzer';
import type { PasswordScore } from '../types';

describe('analyzePassword', () => {
  beforeEach(() => {
    clearCustomDictionary();
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns score 0 for empty string', () => {
      const result = analyzePassword('');
      expect(result.score).toBe(0);
    });

    it('returns score 0-1 for whitespace-only input', () => {
      const result = analyzePassword('   ');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('does not throw on very long input (200+ chars)', () => {
      const longPassword = 'a'.repeat(250);
      expect(() => analyzePassword(longPassword)).not.toThrow();
    });

    it('handles unicode / emoji input without crashing', () => {
      expect(() => analyzePassword('🔐🛡️💪')).not.toThrow();
      expect(() => analyzePassword('şifreMüthiş')).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Turkish name detection
  // -----------------------------------------------------------------------
  describe('Turkish names', () => {
    it('identifies "mehmet" as weak (score ≤ 1)', () => {
      const result = analyzePassword('mehmet');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('identifies "ayse" as weak', () => {
      const result = analyzePassword('ayse');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('identifies name + numbers combo as mediocre', () => {
      const result = analyzePassword('mehmet123');
      expect(result.score).toBeLessThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Turkish surname detection
  // -----------------------------------------------------------------------
  describe('Turkish surnames', () => {
    it('identifies common surnames like "yilmaz" or "ozturk" as weak', () => {
      expect(analyzePassword('yilmaz').score).toBeLessThanOrEqual(1);
      expect(analyzePassword('ozturk').score).toBeLessThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // Football team detection
  // -----------------------------------------------------------------------
  describe('football teams', () => {
    it('identifies "galatasaray" as weak', () => {
      const result = analyzePassword('galatasaray');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('identifies team + foundation year as weak/fair', () => {
      const result = analyzePassword('galatasaray1905');
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it('identifies abbreviated team names', () => {
      const result = analyzePassword('fb1907');
      expect(result.score).toBeLessThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Keyboard walks
  // -----------------------------------------------------------------------
  describe('keyboard walks', () => {
    it('identifies "qweasd" as weak', () => {
      expect(analyzePassword('qweasd').score).toBeLessThanOrEqual(1);
    });

    it('identifies "asdfgh" as weak', () => {
      expect(analyzePassword('asdfgh').score).toBeLessThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // Cultural keywords
  // -----------------------------------------------------------------------
  describe('cultural keywords', () => {
    it('identifies "ataturk" as weak', () => {
      expect(analyzePassword('ataturk').score).toBeLessThanOrEqual(1);
    });

    it('identifies historical years as weak', () => {
      expect(analyzePassword('1453').score).toBeLessThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // City and Plate detection
  // -----------------------------------------------------------------------
  describe('city and plate patterns', () => {
    it('identifies city names like "istanbul", "ankara" as weak', () => {
      expect(analyzePassword('istanbul').score).toBeLessThanOrEqual(1);
      expect(analyzePassword('ankara').score).toBeLessThanOrEqual(1);
    });

    it('identifies plate patterns like "34istanbul" as weak/fair', () => {
      expect(analyzePassword('34istanbul').score).toBeLessThanOrEqual(2);
      expect(analyzePassword('ankara06').score).toBeLessThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Zodiac signs
  // -----------------------------------------------------------------------
  describe('zodiac signs', () => {
    it.each(['akrep', 'aslan', 'başak', 'kova', 'oğlak'])(
      'identifies zodiac "%s" as weak (≤ 2)',
      (sign) => {
        expect(analyzePassword(sign).score).toBeLessThanOrEqual(2);
      }
    );
  });

  // -----------------------------------------------------------------------
  // Brand names
  // -----------------------------------------------------------------------
  describe('brand names', () => {
    it.each(['turkcell', 'akbank', 'trendyol', 'getir', 'migros'])(
      'identifies brand "%s" as weak (≤ 2)',
      (brand) => {
        expect(analyzePassword(brand).score).toBeLessThanOrEqual(2);
      }
    );
  });

  // -----------------------------------------------------------------------
  // Romantic terms
  // -----------------------------------------------------------------------
  describe('romantic terms', () => {
    it('identifies "askim" as weak', () => {
      expect(analyzePassword('askim').score).toBeLessThanOrEqual(1);
    });

    it('identifies "askim123" as weak/fair', () => {
      expect(analyzePassword('askim123').score).toBeLessThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Strong passwords
  // -----------------------------------------------------------------------
  describe('strong passwords', () => {
    it('gives score 4 for a truly random complex password', () => {
      expect(analyzePassword('Xk9#mP2$vL7@nQ5!').score).toBe(4);
    });

    it('gives high score for long passphrase with no patterns', () => {
      expect(
        analyzePassword('correct-horse-battery-staple-extra').score
      ).toBeGreaterThanOrEqual(3);
    });
  });

  // -----------------------------------------------------------------------
  // Return shape
  // -----------------------------------------------------------------------
  describe('return shape', () => {
    it('always returns feedback object with warning and suggestions', () => {
      const result = analyzePassword('test');
      expect(result.feedback).toBeDefined();
      expect(
        typeof result.feedback.warning === 'string' ||
          result.feedback.warning === null
      ).toBe(true);
      expect(Array.isArray(result.feedback.suggestions)).toBe(true);
    });

    it('always returns crackTimesDisplay', () => {
      const result = analyzePassword('password');
      expect(result.crackTimesDisplay).toBeDefined();
      expect(
        typeof result.crackTimesDisplay.onlineNoThrottling10PerSecond
      ).toBe('string');
    });

    it('score is always in range 0-4', () => {
      for (const pw of ['', 'a', 'mehmet', 'Xk9#mP2$vL7@nQ5!']) {
        const result = analyzePassword(pw);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(4);
      }
    });

    it('exposes the full zxcvbn result via raw fields', () => {
      const result = analyzePassword('password');
      expect(typeof result.guesses).toBe('number');
      expect(typeof result.guessesLog10).toBe('number');
      expect(Array.isArray(result.sequence)).toBe(true);
      expect(typeof result.calcTime).toBe('number');
    });
  });

  // -----------------------------------------------------------------------
  // Custom Dictionaries and User Inputs
  // -----------------------------------------------------------------------
  describe('custom dictionaries and user inputs', () => {
    it('penalizes words passed via userInputs dynamically', () => {
      const result = analyzePassword('mySpecialBrand123', ['mySpecialBrand']);
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it('penalizes words registered globally via addCustomDictionary', () => {
      const before = analyzePassword('SomeRandomStartupX');
      expect(before.score).toBeGreaterThanOrEqual(3);

      addCustomDictionary(['SomeRandomStartup']);

      const after = analyzePassword('SomeRandomStartupX');
      expect(after.score).toBeLessThanOrEqual(2);
    });

    it('does not throw when userInputs is undefined', () => {
      expect(() => analyzePassword('hello123', undefined)).not.toThrow();
    });

    it('does not throw when userInputs is an empty array', () => {
      const result = analyzePassword('Xk9#mP2$vL7@nQ5!', []);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
    });

    it('accepts mixed string and number userInputs', () => {
      const result = analyzePassword('john1987', ['John', 1987]);
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it('accepts a readonly userInputs array (as const)', () => {
      const inputs = ['Mehmet', 'mehmet@example.com'] as const;
      const result = analyzePassword('mehmet1907', inputs);
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it('addCustomDictionary is idempotent for repeated calls', () => {
      addCustomDictionary(['DuplicateBrandX']);
      addCustomDictionary(['DuplicateBrandX']);
      addCustomDictionary(['DuplicateBrandX']);
      const result = analyzePassword('DuplicateBrandX99');
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it('addCustomDictionary handles empty array gracefully', () => {
      expect(() => addCustomDictionary([])).not.toThrow();
    });

    it('addCustomDictionary skips empty strings and non-string entries', () => {
      addCustomDictionary([
        'ValidBrand',
        '',
        null as any,
        undefined as any,
        42 as any,
      ]);
      expect(analyzePassword('ValidBrandX').score).toBeLessThanOrEqual(2);
    });

    it('clearCustomDictionary removes previously added entries', () => {
      addCustomDictionary(['EphemeralBrand']);
      const weak = analyzePassword('EphemeralBrandX');
      expect(weak.score).toBeLessThanOrEqual(2);

      clearCustomDictionary();
      const strong = analyzePassword('EphemeralBrandX');
      expect(strong.score).toBeGreaterThanOrEqual(3);
    });

    it('clearCustomDictionary is safe to call when empty', () => {
      expect(() => clearCustomDictionary()).not.toThrow();
      expect(() => clearCustomDictionary()).not.toThrow();
    });

    it('caps the custom dictionary at 10,000 entries and warns', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const tenKEntries = Array.from(
          { length: 10_001 },
          (_, i) => `Brand${i}`
        );
        addCustomDictionary(tenKEntries);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0]?.[0]).toMatch(/exceeds 10000/);
      } finally {
        warn.mockRestore();
      }
    });
  });

  // -----------------------------------------------------------------------
  // Long-input safety (M8)
  // -----------------------------------------------------------------------
  describe('long-input safety', () => {
    it('does not throw on a 2,048-char input', () => {
      const huge = 'a'.repeat(2048);
      expect(() => analyzePassword(huge)).not.toThrow();
    });

    it('does not throw on a 50KB input (pathological paste)', () => {
      const huge = 'A1!b'.repeat(12_500);
      expect(() => analyzePassword(huge)).not.toThrow();
    });

    it('truncates input beyond 1024 chars so the suffix is ignored', () => {
      // The first 1024 chars are weak (single-char repeat). If truncation is
      // in place, anything past that — even a high-entropy suffix — must not
      // change the score. If truncation regresses, the suffix would boost
      // entropy and the score would diverge.
      const cap = 'a'.repeat(1024);
      const composite = cap + 'Xk9#mP2$vL7@nQ5!Xk9#mP2$vL7@nQ5!';
      expect(analyzePassword(composite).score).toBe(analyzePassword(cap).score);
    });
  });

  // -----------------------------------------------------------------------
  // Malformed input type guards (M9)
  // -----------------------------------------------------------------------
  describe('malformed input type guards', () => {
    it('treats null as empty string and returns score 0', () => {
      const result = analyzePassword(null as any);
      expect(result.score).toBe(0);
    });

    it('treats undefined as empty string and returns score 0', () => {
      const result = analyzePassword(undefined as any);
      expect(result.score).toBe(0);
    });

    it('treats a number argument as empty string and does not throw', () => {
      expect(() => analyzePassword(123 as any)).not.toThrow();
      expect(analyzePassword(123 as any).score).toBe(0);
    });

    it('treats an object argument as empty string and does not throw', () => {
      expect(() => analyzePassword({} as any)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Turkish Unicode edge cases (H4)
  // -----------------------------------------------------------------------
  describe('Turkish unicode edge cases', () => {
    it('detects "istanbul34" (lowercase / ASCII) as weak/fair', () => {
      expect(analyzePassword('istanbul34').score).toBeLessThanOrEqual(2);
    });

    it('detects İSTANBUL34 (uppercase Turkish dotted-I) as weak/fair', () => {
      expect(analyzePassword('İSTANBUL34').score).toBeLessThanOrEqual(2);
    });

    it('detects IBRAHIM (English-keyboard regular-I) as weak', () => {
      expect(analyzePassword('IBRAHIM').score).toBeLessThanOrEqual(1);
    });

    it('detects YILMAZ (English-keyboard regular-I surname) as weak', () => {
      expect(analyzePassword('YILMAZ').score).toBeLessThanOrEqual(1);
    });

    it('handles strings containing dotless ı / dotted İ without throwing', () => {
      expect(() => analyzePassword('ısıİI')).not.toThrow();
      expect(() => analyzePassword('IıİI')).not.toThrow();
    });

    it('handles strings containing combining diacritics (NFD form)', () => {
      // 'ğ' as composed (U+011F)
      const composed = analyzePassword('ağa');
      // 'g' + combining breve (U+0306)
      const decomposed = analyzePassword('ağa');
      expect(composed.score).toBeGreaterThanOrEqual(0);
      expect(decomposed.score).toBeGreaterThanOrEqual(0);
    });

    it('handles paste with embedded newline', () => {
      expect(() => analyzePassword('şifre\n123')).not.toThrow();
    });

    it('handles surrogate-pair emoji mixed with text', () => {
      expect(() => analyzePassword('şifre🇹🇷123')).not.toThrow();
      expect(() => analyzePassword('🔐💪🛡️')).not.toThrow();
    });

    it('handles right-to-left override character (security-relevant)', () => {
      expect(() => analyzePassword('safe‮unsafe')).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // Turkish translations (B4)
  // -----------------------------------------------------------------------
  describe('turkish translations', () => {
    it('returns warning strings in Turkish for common patterns', () => {
      const result = analyzePassword('123456');
      const text = [
        result.feedback.warning ?? '',
        ...result.feedback.suggestions,
      ].join(' ');
      // Turkish letters / characteristic words should appear; English staples
      // like "Avoid" or "Easy" should not.
      expect(text).toMatch(/[şŞçÇğĞıİöÖüÜ]|paro|kolay|kelime/i);
      expect(text).not.toMatch(/easy to guess/i);
    });
  });

  // -----------------------------------------------------------------------
  // Score regression snapshot (H6)
  // -----------------------------------------------------------------------
  // A pinned set of canary inputs whose scores must not drift across
  // refactors or dictionary expansions. If zxcvbn or a dictionary change
  // legitimately moves a score, update this fixture *intentionally* and
  // call out the change in CHANGELOG migration notes.
  describe('score regression snapshot', () => {
    const fixtures: ReadonlyArray<readonly [string, PasswordScore]> = [
      ['', 0],
      ['a', 0],
      ['12', 0],
      ['password', 0],
      ['123456', 0],
      ['qwerty', 0],
      ['mehmet', 0],
      ['ayse', 0],
      ['fatma', 0],
      ['yilmaz', 0],
      ['kaya', 0],
      ['demir', 0],
      ['galatasaray', 0],
      ['fenerbahce', 0],
      ['cimbom', 0],
      ['istanbul', 0],
      ['ataturk', 0],
      ['cumhuriyet', 0],
      ['1923', 0],
      ['askim', 0],
      ['canim', 0],
      ['asdfgh', 0],
      ['1qaz2wsx', 0],
      ['mehmet1907', 1],
      ['ayse1234', 1],
      ['galatasaray1905', 1],
      ['34istanbul', 0],
      ['Xk9#mP2$vL7@nQ5!', 4],
      ['correct-horse-battery-staple-extra', 4],
      ['this-is-an-uncommon-passphrase-with-many-words', 4],
    ];

    it.each(fixtures)('"%s" pinned to score %i', (password, expected) => {
      expect(analyzePassword(password).score).toBe(expected);
    });
  });

  // -----------------------------------------------------------------------
  // Expanded surname coverage (samples from the merged 382-entry list)
  // -----------------------------------------------------------------------
  describe('expanded Turkish surname coverage', () => {
    const surnameSamples = [
      'akbulut',
      'arıkan',
      'bayraktar',
      'erdoğan',
      'kara',
      'köse',
      'özdemir',
      'sarı',
      'tekin',
      'yıldız',
    ];
    it.each(surnameSamples)(
      'identifies surname "%s" as weak (≤ 2)',
      (surname) => {
        expect(analyzePassword(surname).score).toBeLessThanOrEqual(2);
      }
    );
  });
});
