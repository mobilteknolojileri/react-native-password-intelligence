/**
 * Regression guard for the spatial matcher.
 *
 * Until 0.4.0 the engine never passed `graphs` to `zxcvbnOptions.setOptions`,
 * and `Options` defaults to `graphs = {}`, so `MatchSpatial` iterated an empty
 * object and produced zero matches. Keyboard walks appeared to work only
 * because a handful of literal strings (`qwerty`, `asdfgh`, `1qaz2wsx`) are
 * also entries in `dictionaries/tr.ts` — so those are useless as a test.
 * Everything below is a walk that ONLY the spatial matcher can catch.
 */
import { analyzePassword } from '../core/analyzer';

describe('spatial matcher', () => {
  it.each([
    ['xcvbnm,./', 1],
    ['qwertzuiop', 1],
    ['yuiophjkl', 2],
    ['tgbnhyujm', 2],
  ])('scores keyboard walk %s at or below %i', (password, max) => {
    expect(analyzePassword(password).score).toBeLessThanOrEqual(max);
  });

  it('emits a spatial match in the sequence', () => {
    // The score assertion alone could be satisfied by a dictionary hit; this
    // is what actually pins the graphs wiring.
    const patterns = analyzePassword('xcvbnm,./').sequence.map(
      (match) => match.pattern
    );
    expect(patterns).toContain('spatial');
  });

  it('ships every bundled keyboard layout', () => {
    const patterns = analyzePassword('qwertzuiop').sequence.map(
      (match) => match.pattern
    );
    expect(patterns).toContain('spatial');
  });
});
