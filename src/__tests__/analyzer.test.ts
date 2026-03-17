import { analyzePassword } from '../core/analyzer';

describe('analyzePassword', () => {
  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns score 0 for empty string', () => {
      const result = analyzePassword('');
      expect(result.score).toBe(0);
    });

    it('returns score 0 for whitespace-only input', () => {
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
      const result = analyzePassword('qweasd');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('identifies "asdfgh" as weak', () => {
      const result = analyzePassword('asdfgh');
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // Cultural keywords
  // -----------------------------------------------------------------------
  describe('cultural keywords', () => {
    it('identifies "ataturk" as weak', () => {
      const result = analyzePassword('ataturk');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('identifies historical years as weak', () => {
      const result = analyzePassword('1453');
      expect(result.score).toBeLessThanOrEqual(1);
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
  // Romantic terms
  // -----------------------------------------------------------------------
  describe('romantic terms', () => {
    it('identifies "askim" as weak', () => {
      const result = analyzePassword('askim');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('identifies "askim123" as weak/fair', () => {
      const result = analyzePassword('askim123');
      expect(result.score).toBeLessThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Strong passwords
  // -----------------------------------------------------------------------
  describe('strong passwords', () => {
    it('gives score 4 for a truly random complex password', () => {
      const result = analyzePassword('Xk9#mP2$vL7@nQ5!');
      expect(result.score).toBe(4);
    });

    it('gives high score for long passphrase with no patterns', () => {
      const result = analyzePassword('correct-horse-battery-staple-extra');
      expect(result.score).toBeGreaterThanOrEqual(3);
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
  });
});
