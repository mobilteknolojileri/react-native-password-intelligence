// Public API surface — React Native bindings.
//
// The full framework-agnostic core surface is re-exported so that existing
// imports keep working unchanged; `password-intelligence` is the same code.
export * from 'password-intelligence';

export { usePasswordRisk } from './hooks/usePasswordRisk';
export { PasswordMeter } from './ui/PasswordMeter';
export type { PasswordMeterProps } from './ui/PasswordMeter';
