/**
 * Engine state is module-global (`configure`, `addCustomDictionary`), so every
 * test starts from the bundled defaults.
 */
import {
  clearCustomDictionary,
  resetConfiguration,
} from 'password-intelligence';

beforeEach(() => {
  resetConfiguration();
  clearCustomDictionary();
});
