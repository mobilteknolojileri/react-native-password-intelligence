/**
 * The wrapper must keep re-exporting the whole core surface, otherwise a
 * 0.3.x consumer's `import { analyzePassword } from
 * 'react-native-password-intelligence'` silently breaks on upgrade.
 */
import * as core from 'password-intelligence';

import * as api from '../index';

describe('wrapper public API surface', () => {
  it('re-exports every core runtime export', () => {
    for (const name of Object.keys(core)) {
      expect(Object.keys(api)).toContain(name);
    }
  });

  it('exports exactly the core surface plus the React Native bindings', () => {
    expect(Object.keys(api).sort()).toEqual(
      [...Object.keys(core), 'PasswordMeter', 'usePasswordRisk'].sort()
    );
  });
});
