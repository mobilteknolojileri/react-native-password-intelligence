# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-02

### Added
- **Contextual user inputs**: `analyzePassword(password, userInputs?)` and `usePasswordRisk(password, userInputs?)` now accept an optional list of user-specific values (e.g., name, email, username) so passwords containing them are penalized.
- **`<PasswordMeter />`** also accepts `userInputs` (only when `password` prop is provided).
- **`addCustomDictionary(customWords)`**: registers global custom dictionary entries (e.g., company brand names) penalized in every analysis. Idempotent (deduplicated via `Set`) and bounded (capped at 10,000 entries).
- **`clearCustomDictionary()`**: clears all entries previously registered via `addCustomDictionary`. Intended for test isolation and multi-tenant SSR scenarios.
- **Inline Turkish translations**: feedback warnings and suggestions are now returned in Turkish by default, matching the dictionary intelligence layer. The `@zxcvbn-ts/language-en` dependency is no longer required at runtime.
- **Dual-locale case-folding**: passwords are evaluated under both `toLowerCase()` and `toLocaleLowerCase('tr-TR')`; the more pessimistic score is returned. Catches both English-keyboard typings (`IBRAHIM`, `YILMAZ`) and Turkish-keyboard typings (`İSTANBUL34`).
- **Long-input guard**: passwords longer than 1,024 characters are truncated before being passed to zxcvbn, protecting the UI thread from O(n²) matcher cost on pathological pastes.
- **Expanded Turkish surname dictionary**: `commonSurnames` grew from 60 to 382 entries (TÜİK / NVI top surnames).
- **New dictionary categories**: `zodiacSigns` (12 entries) and `brands` (24 common Turkish brands — Turkcell, Akbank, Trendyol, Migros, Getir, etc.).
- **`PasswordMeterProps` is now exported** so consumers can wrap or extend the component with full type safety.
- **`sideEffects: false`** declared in `package.json` for tree-shakeable consumer bundles.
- **`engines.node >= 18`** declared.
- **`prepublishOnly`** script: lint, typecheck, test, and build run automatically before any `npm publish`.
- **Coverage threshold**: Jest config gates at 85% lines / 80% functions / 75% branches / 85% statements.
- **`SECURITY.md`** with a coordinated disclosure policy.
- **`ARCHITECTURE.md`** documenting design rationale, dictionary categorization, deferred-initialization strategy, and the future locale-plugin roadmap.
- **Score-regression snapshot fixture** (30+ pinned inputs) so dictionary or scoring drift fails CI rather than silently shipping.
- **GitHub release workflow** with OIDC `id-token: write` permission and `npm publish --provenance` for SLSA attestation.
- **Dependabot config** for weekly dependency PRs (root, example workspace, and GitHub Actions).
- **PR template, CODEOWNERS, FUNDING.yml, `.prettierignore`** — repo polish.
- Test count grew from 33 → 127, including Turkish Unicode edge cases (İ/ı, dotted/dotless I both keyboards), 1,024-char input safety, malformed-input type guards, score-regression snapshot, and translation language assertions.

### Changed
- **`PasswordMeter` no longer initializes the analyzer when `score` is provided directly**, eliminating a wasted zxcvbn options-registration call for consumers passing a pre-computed score.
- **`addCustomDictionary` is now bounded and idempotent**: previous behavior allowed unbounded array growth on repeated calls.
- **`usePasswordRisk` and `analyzePassword`** now accept `readonly (string | number)[]` for `userInputs`, so consumers can pass `as const` arrays without copying.
- **`peerDependencies`** moved from `"react": "*", "react-native": "*"` to `"react": ">=18.0.0", "react-native": ">=0.74.0"` to surface incompatibilities at install time.
- **`PasswordMeter`'s `style` prop** changed from `ViewStyle` to `StyleProp<ViewStyle>`, accepting style arrays, falsy values, and registered style IDs as React Native expects.
- **`tsconfig.json`** strictness raised: `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `isolatedModules`, `useDefineForClassFields`.
- `usePasswordRisk` now memoizes by JSON-serialized value of `userInputs` (no eslint-disable, no stale-closure risk) so consumers can pass inline arrays freely.
- Dictionary `COMPACT_PATTERN` extended to handle smart quotes, em-dash, and en-dash.
- Cross-category duplicate entries removed (cities now live only in `cityNames`, not also in `culturalKeywords`).
- Religious / nationalist dictionary block now carries a clear threat-intel rationale comment.

### Removed
- Runtime dependency on `@zxcvbn-ts/language-en`. To restore English feedback strings, install it yourself and call `zxcvbnOptions.setOptions({ translations: enTranslations })` after the first `analyzePassword` call.

## Migration from 0.2.x to 0.3.0

The public API is **fully backwards-compatible**. Every 0.2.x call signature still works. The list below covers behavioral changes that may shift observable output even when call sites are unchanged.

### Five-minute upgrade checklist

1. **Bump and install.**
   ```bash
   yarn add react-native-password-intelligence@^0.3.0
   ```

2. **Re-run your password test fixtures.** The expanded surname dictionary (60 → 382 entries) plus the new zodiac and brand categories may shift some Turkish-cultural inputs by ±1 score point. If you hard-gate on `score >= N`, audit your fixtures.
   ```bash
   yarn jest path/to/your/password-tests
   ```

3. **Decide on the feedback language.** As of 0.3.0 `feedback.warning` and `feedback.suggestions` are Turkish by default. If your UI displayed the English strings directly:

   **Option A — embrace Turkish (recommended for Turkish-speaking users):**
   ```tsx
   <Text>{feedback.warning}</Text>
   ```

   **Option B — restore English at app startup:**
   ```ts
   import { zxcvbnOptions } from '@zxcvbn-ts/core';
   import { translations as enTranslations } from '@zxcvbn-ts/language-en';
   import { analyzePassword } from 'react-native-password-intelligence';

   // Trigger our default init, then override translations.
   analyzePassword('');
   zxcvbnOptions.setOptions({ translations: enTranslations });
   ```

   You'll need to add `@zxcvbn-ts/language-en` to your own dependencies — it's no longer pulled in transitively.

4. **Optional — adopt the new APIs.**
   - Pass `userInputs={[user.firstName, user.email]}` to `<PasswordMeter />` to penalize passwords containing user-specific values.
   - Call `addCustomDictionary(['BrandA', 'BrandB'])` once at app startup to penalize company-specific words globally.
   - Call `clearCustomDictionary()` between tests for isolation.

5. **No action needed** for: long-input truncation (transparent for legitimate input; only affects pathological 1,024+ char pastes), null/undefined `password` arguments (now coerced to `''` instead of throwing), or the `peerDependencies` range tightening (you're already on React 18+ and RN 0.74+ if you got here).

### What did NOT change

- The `score` field is still `0 | 1 | 2 | 3 | 4`.
- `crackTimeDisplay`, `feedback.warning`, `feedback.suggestions` are still on the same paths.
- The `PasswordMeter` color scale is unchanged.
- No exports were renamed or removed.

## [0.2.2] - 2026-03-19

- Documentation polish (common names and city plate examples).
- Demo image placeholder added to README.

## [0.2.0] - 2026-03

- Production-ready release with Turkish intelligence layer (common names, football culture, city plates, cultural/historic, romantic, keyboard walks).
- Headless hook (`usePasswordRisk`), UI component (`PasswordMeter`), and pure `analyzePassword` API.

## [0.1.0]

- Initial public scaffold.

[0.3.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.3.0
[0.2.2]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.2.2
[0.2.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.2.0
[0.1.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.1.0
