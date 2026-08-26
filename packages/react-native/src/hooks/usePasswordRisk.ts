import { useMemo, useSyncExternalStore } from 'react';

import {
  analyzePassword,
  getConfigurationVersion,
  subscribeToConfiguration,
} from 'password-intelligence';
import type { PasswordRiskResult } from 'password-intelligence';

/**
 * Memoized hook for password risk assessment. Returns a stable result object
 * that only recomputes when `password`, the values inside `userInputs`, or
 * the engine configuration change.
 *
 * `userInputs` is intentionally memoized by VALUE (via JSON.stringify) rather
 * than by reference, so consumers can pass inline arrays without triggering
 * an analyzer call on every render.
 *
 * The engine configuration is module-global (`configure()`,
 * `addCustomDictionary()`, ...), so it is read through
 * `useSyncExternalStore`: a `configure()` call that lands after the first
 * render — typically once `@zxcvbn-ts/language-common` finishes loading —
 * re-renders every mounted meter instead of leaving it on a stale score.
 */
export const usePasswordRisk = (
  password: string,
  userInputs?: readonly (string | number)[]
): PasswordRiskResult => {
  const inputsKey = userInputs ? JSON.stringify(userInputs) : '';
  const configurationVersion = useSyncExternalStore(
    subscribeToConfiguration,
    getConfigurationVersion,
    getConfigurationVersion
  );

  return useMemo(() => {
    const inputs = inputsKey
      ? (JSON.parse(inputsKey) as readonly (string | number)[])
      : undefined;
    const result = analyzePassword(password, inputs);

    return {
      score: result.score,
      feedback: result.feedback,
      crackTimeDisplay: result.crackTimesDisplay.onlineNoThrottling10PerSecond,
      raw: result,
    };
    // configurationVersion is a cache key, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, inputsKey, configurationVersion]);
};
