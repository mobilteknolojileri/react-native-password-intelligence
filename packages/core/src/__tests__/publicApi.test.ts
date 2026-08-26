/**
 * Exhaustive equality on the barrel, not `toContain`: this must fail on an
 * accidental removal (0.3.0 shipped `clearCustomDictionary` documented in the
 * README but absent from the barrel) *and* on an accidental addition.
 */
import * as api from '../index';

describe('public API surface', () => {
  it('exports exactly the documented runtime surface', () => {
    expect(Object.keys(api).sort()).toEqual([
      'addCustomDictionary',
      'analyzePassword',
      'clearCustomDictionary',
      'configure',
      'getConfigurationVersion',
      'resetConfiguration',
      'subscribeToConfiguration',
    ]);
  });

  it('exports callable functions', () => {
    for (const name of Object.keys(api)) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe('function');
    }
  });
});
