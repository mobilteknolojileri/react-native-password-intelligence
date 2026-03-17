import { useMemo } from 'react';

import { analyzePassword } from '../core/analyzer';
import type { PasswordRiskResult } from '../types';

/**
 * Memoized hook for password risk assessment.
 *
 * Returns a stable result object that only recomputes when `password` changes.
 * For advanced use cases, the full zxcvbn-ts result is available via `raw`.
 */
export const usePasswordRisk = (password: string): PasswordRiskResult => {
  return useMemo(() => {
    const result = analyzePassword(password);

    return {
      score: result.score,
      feedback: result.feedback,
      crackTimeDisplay: result.crackTimesDisplay.onlineNoThrottling10PerSecond,
      raw: result,
    };
  }, [password]);
};
