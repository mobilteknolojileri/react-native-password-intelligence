// Public API surface
export { analyzePassword, addCustomDictionary } from './core/analyzer';
export { usePasswordRisk } from './hooks/usePasswordRisk';
export { PasswordMeter } from './ui/PasswordMeter';

// Types
export type {
  PasswordRiskResult,
  PasswordScore,
  TurkishDictionary,
  ZxcvbnResult,
} from './types';
