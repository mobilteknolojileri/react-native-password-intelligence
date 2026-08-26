/**
 * Case handling.
 *
 * 0.3.0 scored `toLowerCase()` and `toLocaleLowerCase('tr-TR')` and returned
 * the lower score, which discarded uppercase entropy on every mixed-case
 * password and made zxcvbn's capitalization suggestions unreachable. 0.4.0
 * scores the password as typed and re-scores an ASCII-folded copy only when
 * default Unicode casing would miss a Turkish entry. See `core/turkishCase.ts`.
 */
import { addCustomDictionary, analyzePassword } from '../core/analyzer';
import {
  buildTurkishDictionary,
  expandTurkishVariants,
  lowerTurkish,
  repairTurkishCase,
  toAsciiTurkish,
} from '../core/turkishCase';

const dictionaryNames = (password: string, userInputs?: string[]) =>
  analyzePassword(password, userInputs)
    .sequence.filter((match) => match.pattern === 'dictionary')
    .map((match) => (match as { dictionaryName?: string }).dictionaryName);

describe('Turkish case handling', () => {
  describe('lowerTurkish', () => {
    it('matches toLocaleLowerCase("tr-TR") for the letters that differ', () => {
      expect(lowerTurkish('IŞIK İstanbul')).toBe('ışık istanbul');
      expect(lowerTurkish('i̇stanbul')).toBe('istanbul');
    });
  });

  describe('toAsciiTurkish', () => {
    it('folds both cases and leaves ASCII untouched', () => {
      expect(toAsciiTurkish('ÇĞİÖŞÜ çğıöşü')).toBe('CGIOSU cgiosu');
      expect(toAsciiTurkish('plain')).toBe('plain');
    });
  });

  describe('expandTurkishVariants', () => {
    it('emits Turkish, compact, ASCII and compact ASCII forms once each', () => {
      expect(expandTurkishVariants(' Ömer Asaf ')).toEqual([
        'ömer asaf',
        'ömerasaf',
        'omer asaf',
        'omerasaf',
      ]);
      expect(expandTurkishVariants('kaya')).toEqual(['kaya']);
      expect(expandTurkishVariants('   ')).toEqual([]);
    });

    it('is the fold used by every bundled dictionary', () => {
      expect(buildTurkishDictionary(['İstanbul', 'istanbul', 'Işık'])).toEqual([
        'istanbul',
        'ışık',
        'isik',
      ]);
    });
  });

  describe('repairTurkishCase', () => {
    it('rewrites the dotted capital I while keeping it uppercase', () => {
      expect(repairTurkishCase('İSTANBUL')).toBe('ISTANBUL');
    });

    it('collapses an already-decomposed i + combining dot', () => {
      expect(repairTurkishCase('i̇stanbul')).toBe('istanbul');
    });

    it('ASCII-folds an uppercase I that sits next to another Turkish letter', () => {
      // Default casing turns this into `şanliurfa`, which is neither the
      // Turkish (`şanlıurfa`) nor the ASCII (`sanliurfa`) dictionary variant.
      expect(repairTurkishCase('ŞANLIURFA')).toBe('SANLIURFA');
      expect(repairTurkishCase('Işık2024!')).toBe('Isik2024!');
    });

    it('is a no-op for pure ASCII and for Turkish input without a capital I', () => {
      expect(repairTurkishCase('Xk9#mP2$vL7@nQ5!')).toBe('Xk9#mP2$vL7@nQ5!');
      expect(repairTurkishCase('IBRAHIM')).toBe('IBRAHIM');
      expect(repairTurkishCase('Şanlıurfa')).toBe('Şanlıurfa');
      expect(repairTurkishCase('çağla')).toBe('çağla');
    });
  });

  it('preserves uppercase entropy', () => {
    expect(analyzePassword('SunFlower77').score).toBeGreaterThan(
      analyzePassword('sunflower77').score
    );
    expect(analyzePassword('QwErTy123').score).toBeGreaterThan(
      analyzePassword('qwerty123').score
    );
  });

  it('surfaces the capitalization suggestion', () => {
    const { feedback } = analyzePassword('Galatasaray1905!');
    expect(feedback.suggestions.join(' ')).toMatch(/büyük yaz/i);
  });

  it.each(['İSTANBUL34', 'İstanbul', 'ISTANBUL34', 'IBRAHIM', 'YILMAZ'])(
    'still detects Turkish input %s',
    (password) => {
      expect(analyzePassword(password).score).toBeLessThanOrEqual(2);
    }
  );

  it.each(['ŞANLIURFA', 'KIRŞEHİR', 'IĞDIR', 'IŞIK', 'AĞRI', 'AŞKIM'])(
    'detects all-caps Turkish word %s typed with an ASCII I',
    (password) => {
      // Each of these scored 1-3 when only the dotted İ was repaired.
      expect(analyzePassword(password).score).toBe(
        analyzePassword(password.toLocaleLowerCase('tr-TR')).score
      );
    }
  );

  it('echoes the analysed password, not the folded copy', () => {
    expect(analyzePassword('ŞANLIURFA').password).toBe('ŞANLIURFA');
  });

  describe('custom words and userInputs use the same fold as the dictionaries', () => {
    it('matches a custom word containing İ however the user types it', () => {
      addCustomDictionary(['İkbalcan']);
      for (const password of [
        'ikbalcan2024!',
        'IKBALCAN2024!',
        'İkbalcan2024!',
      ]) {
        expect(dictionaryNames(password)).toContain('custom');
      }
    });

    it('matches a custom word with dotless ı typed on an English keyboard', () => {
      addCustomDictionary(['Kırmızı']);
      expect(dictionaryNames('KIRMIZI2024!')).toContain('custom');
    });

    it('expands multi-word custom entries to their compact form', () => {
      addCustomDictionary(['İstanbul Holding']);
      expect(dictionaryNames('istanbulholding1')).toContain('custom');
    });

    it('matches userInputs containing İ or ı', () => {
      // Words absent from every bundled dictionary, so the only possible
      // dictionary match is the per-call one.
      expect(dictionaryNames('İkbalcan2024!', ['İkbalcan'])).toContain(
        'userInputs'
      );
      expect(dictionaryNames('ikbalcan2024!', ['İkbalcan'])).toContain(
        'userInputs'
      );
      expect(dictionaryNames('KILICZADE2024!', ['Kılıçzade'])).toContain(
        'userInputs'
      );
    });
  });

  it('does not leak userInputs across calls', () => {
    // zxcvbn-ts's extendUserInputsDictionary never writes back to
    // options.dictionary.userInputs, so omitting the argument leaves the
    // previous call's inputs active. analyzePassword always passes an array.
    analyzePassword('whatever', ['Ali']);
    expect(analyzePassword('AliXQ7m2').score).toBeGreaterThanOrEqual(2);
  });
});
