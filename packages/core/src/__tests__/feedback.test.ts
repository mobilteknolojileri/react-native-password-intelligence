/**
 * Turkish dictionary matches must explain themselves.
 *
 * zxcvbn only emits a dictionary warning for `passwords`, `lastnames`,
 * `userInputs`, or names containing `firstnames`/`wikipedia`. Every Turkish
 * intelligence category fell outside that set, so until 0.4.0 the library's
 * headline feature produced a score of 0 with `warning: null` - the user was
 * told their password was rejected but never why.
 */
import { addCustomDictionary, analyzePassword } from '../core/analyzer';
import { configure } from '../core/engine';

describe('Turkish feedback', () => {
  it.each([
    ['galatasaray', /takım|taraftar/i],
    ['istanbul', /şehir/i],
    ['mehmet', /ad veya soyad/i],
    ['yilmaz', /ad veya soyad/i],
    ['askim', /sevgi/i],
    ['turkcell', /marka/i],
    ['1453', /kültürel|tarih/i],
    ['koc', /burç|ad veya soyad/i],
  ])('returns a Turkish warning for %s', (password, pattern) => {
    const { warning } = analyzePassword(password).feedback;
    expect(warning).not.toBeNull();
    expect(warning).toMatch(pattern);
  });

  it('never returns a null warning for a floor-zero Turkish password', () => {
    for (const password of [
      'galatasaray',
      'fenerbahce',
      'besiktas',
      'ankara',
      'canim',
      'akbank',
    ]) {
      const result = analyzePassword(password);
      expect(result.score).toBe(0);
      expect(result.feedback.warning).not.toBeNull();
    }
  });

  it('explains a custom dictionary hit', () => {
    addCustomDictionary(['AcmeCorp']);
    expect(analyzePassword('acmecorp').feedback.warning).toMatch(/yasaklı/i);
  });

  it('leaves zxcvbn built-in warnings untouched', () => {
    // `password` hits the bundled English list, which zxcvbn explains itself.
    expect(analyzePassword('password').feedback.warning).toMatch(
      /en sık kullanılan/i
    );
  });

  it.each([
    'Xq7#Zm2!pL9zzQ-galatasaray',
    'correct horse battery istanbul',
    'Tr4v3l-b3st-akbank-99Q',
  ])('follows zxcvbn and stays silent on strong password %s', (password) => {
    // zxcvbn returns no warning at score 3-4; a Turkish token buried in a
    // strong passphrase must not put a red warning under a green meter.
    const result = analyzePassword(password);
    expect(result.score).toBeGreaterThan(2);
    expect(result.feedback.warning).toBeNull();
  });

  it('ignores dictionary names that only exist on Object.prototype', () => {
    configure({ dictionaries: { constructor: ['zzproto'] } });
    expect(analyzePassword('zzproto').feedback.warning).toBeNull();
  });
});
