import { useMemo } from 'react';

import { analyzePassword } from '../core/analyzer';
import type { PasswordRiskResult } from '../types';

/**
 * Memoized hook for password risk assessment. Returns a stable result object
 * that only recomputes when `password` or the values inside `userInputs` change.
 *
 * `userInputs` is intentionally memoized by VALUE (via JSON.stringify) rather
 * than by reference, so consumers can pass inline arrays without triggering
 * an analyzer call on every render.
 */
export const usePasswordRisk = (
  password: string,
  userInputs?: readonly (string | number)[]
): PasswordRiskResult => {
  const inputsKey = userInputs ? JSON.stringify(userInputs) : '';

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
  }, [password, inputsKey]);
};
