/**
 * Engine state is module-global (`configure`, `addCustomDictionary`), so every
 * test starts from the bundled defaults. Isolation is guaranteed here rather
 * than by a `beforeEach` copied into each file.
 */
import { clearCustomDictionary } from './src/core/analyzer';
import { resetConfiguration } from './src/core/engine';

beforeEach(() => {
  resetConfiguration();
  clearCustomDictionary();
});
