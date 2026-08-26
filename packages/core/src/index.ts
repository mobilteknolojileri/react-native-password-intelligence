// Public API surface - framework-agnostic core.
//
// This package has no react or react-native dependency and runs anywhere:
// Node, Next.js, plain React, React Native, Deno, browsers.
export {
  analyzePassword,
  addCustomDictionary,
  clearCustomDictionary,
} from './core/analyzer';
export {
  configure,
  getConfigurationVersion,
  resetConfiguration,
  subscribeToConfiguration,
} from './core/engine';

// Types
export type {
  AdjacencyGraphsInput,
  DictionaryInput,
  PasswordIntelligenceConfig,
} from './core/engine';
export type {
  DictionaryArray,
  PasswordIntelligenceTranslations,
  PasswordRiskResult,
  PasswordScore,
  TurkishDictionary,
  ZxcvbnResult,
} from './types';
