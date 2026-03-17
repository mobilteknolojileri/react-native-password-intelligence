# react-native-password-intelligence — Master Refactoring Plan

> **Context for any AI agent reading this file:**
> This is a React Native library that wraps `@zxcvbn-ts/core` with Turkish-specific password intelligence (names, football teams, city plate codes, keyboard walks, cultural keywords). The project was scaffolded with `create-react-native-library` (bob-based) and uses Yarn 4 workspaces with an Expo example app.
>
> A comprehensive peer review was conducted on 2026-03-18. This file documents every issue found and the exact fix required, in chronological execution order. Each phase should be committed atomically following the project's Conventional Commits spec in `COMMIT_CONVENTION.md`.
>
> **Goal**: Bring every file to Principal Systems Engineer quality — 10/10 in code review.

---

## Project Structure Reference

```
react-native-password-intelligence/
├── src/
│   ├── index.tsx              ← barrel export (re-exports everything)
│   ├── core/
│   │   └── analyzer.ts        ← zxcvbn-ts wrapper, dictionary init, analyzePassword()
│   ├── dictionaries/
│   │   └── tr.ts              ← Turkish password patterns (names, teams, cities, etc.)
│   ├── hooks/
│   │   └── usePasswordRisk.ts ← React hook wrapping analyzePassword with useMemo
│   ├── ui/
│   │   └── PasswordMeter.tsx  ← Animated progress bar component (vanilla RN Animated)
│   └── __tests__/
│       └── index.test.tsx     ← 4 unit tests
├── example/
│   └── src/App.tsx            ← Expo demo app
├── package.json               ← 3 runtime deps (@zxcvbn-ts/*), peerDeps: react + react-native
├── README.md
├── COMMIT_CONVENTION.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── tsconfig.json              ← strict mode, bundler resolution
├── eslint.config.mjs
├── lefthook.yml
├── turbo.json
└── .github/
    ├── workflows/ci.yml       ← 4 jobs: lint, test, build-library, build-web
    ├── actions/setup/action.yml
    └── ISSUE_TEMPLATE/
```

---

## Phase 1: Critical Bug Fixes (Foundation)

These are bugs that break core functionality. Must be fixed first.

### 1.1 — Fix dictionary format: `string[]` → `buildDictionary` strategy

- **File**: `src/dictionaries/tr.ts`
- **Problem**: zxcvbn-ts expects dictionaries either as `Record<string, number>` (rankings) or `string[]` (ordered by frequency). The initial version had manual arrays with duplicates and mojibake.
- **Fix**: Implemented a `buildDictionary` strategy that takes canonical Turkish lists and automatically generates ASCII and "compact" variants.
- **Commit**: `fix(dict): implement buildDictionary strategy for automated variants`

### 1.2 — Remove broken `graphs` override in analyzer

- **File**: `src/core/analyzer.ts`
- **Problem**: Lines 13-18 override `graphs.qwerty` with `{ adjacency: [] }`, which **disables** zxcvbn-ts's built-in keyboard walk detection entirely. The QWERTY graph is critical for detecting patterns like `qweasd`, `asdfgh` etc.
- **Fix**: Remove the entire `graphs` block from the options object. Let zxcvbn-ts use its default QWERTY adjacency graph (which already closely matches the Turkish Q keyboard layout).
- **Commit**: `fix(core): remove empty adjacency graph that disabled keyboard walk detection`

### 1.3 — Fix `analyzePassword` return type mismatch

- **File**: `src/core/analyzer.ts`
- **Problem**: The empty-password branch returns a manually constructed object `{ score: 0, feedback: {...}, crackTimesDisplay: {...} }` which does NOT match the full `ZxcvbnResult` type. This creates a union type that breaks downstream type safety.
- **Fix**:
  1. Import `ZxcvbnResult` type from `@zxcvbn-ts/core`
  2. Add explicit return type annotation: `analyzePassword(password: string): ZxcvbnResult`
  3. For the empty-password case, call `zxcvbn('')` instead of manually constructing a partial object, OR construct a full `ZxcvbnResult`-compatible object
- **Commit**: `fix(core): add explicit return type and fix empty-password branch`

---

## Phase 2: TypeScript Hardening

### 2.1 — Create shared types file

- **File**: `src/types.ts` [NEW]
- **Action**: Create a central types file exporting:
  ```typescript
  import type { ZxcvbnResult } from '@zxcvbn-ts/core';

  export type DictionaryArray = string[];

  export interface TurkishDictionary {
    commonNames: DictionaryArray;
    commonSurnames: DictionaryArray;
    footballTeams: DictionaryArray;
    cityNames: DictionaryArray;
    platePatterns: DictionaryArray;
    keyboardWalks: DictionaryArray;
    culturalKeywords: DictionaryArray;
    romanticTerms: DictionaryArray;
    religiousNationalistic: DictionaryArray;
    commonPasswords: DictionaryArray;
  }

  export interface PasswordRiskResult {
    /** 0-4 score where 0 = very weak, 4 = very strong. */
    score: PasswordScore;
    /** Human-readable feedback from zxcvbn-ts */
    feedback: ZxcvbnResult['feedback'];
    /** Estimated crack time for online attack (10/s) */
    crackTimeDisplay: string;
    /** Full zxcvbn-ts result for advanced use cases */
    raw: ZxcvbnResult;
  }

  export type PasswordScore = 0 | 1 | 2 | 3 | 4;
  ```
- **Commit**: `feat(core): add shared typescript interfaces`

### 2.2 — Apply types to `usePasswordRisk`

- **File**: `src/hooks/usePasswordRisk.ts`
- **Action**: Import `PasswordRiskResult` and annotate return type explicitly.
- **Commit**: `refactor(hooks): add explicit return type to usePasswordRisk`

### 2.3 — Improve `PasswordMeterProps` with discriminated union

- **File**: `src/ui/PasswordMeter.tsx`
- **Action**: Replace the current `PasswordMeterProps` interface with a discriminated union so that the user must provide either `password` OR `score`, not neither:
  ```typescript
  type PasswordMeterProps = (
    | { password: string; score?: never }
    | { score: PasswordScore; password?: never }
  ) & {
    style?: ViewStyle;
    barHeight?: number;
  };
  ```
- **Commit**: `refactor(ui): use discriminated union for PasswordMeter props`

### 2.4 — Add `as const` to `tr.ts` and export from barrel

- **File**: `src/index.tsx` → rename to `src/index.ts`
- **Action**:
  1. Rename `index.tsx` to `index.ts` (no JSX in barrel export)
  2. Also export the types: `export type { PasswordRiskResult, PasswordScore, TurkishDictionary } from './types';`
  3. Update `tsconfig.build.json` if path references changed
- **Commit**: `refactor(core): rename barrel to index.ts and export shared types`

---

## Phase 3: Turkish Intelligence Expansion

### 3.1 — Expand `commonNames` to 200+ entries

- **File**: `src/dictionaries/tr.ts`
- **Action**: Expand the name list to cover top 200+ Turkish names by frequency (both male and female). Include both ASCII-only AND Turkish-character variants:
  - `omer: 30, ömer: 31` (both representations)
  - `huseyin: 8, hüseyin: 9`
  - `ayse: 3, ayşe: 4`
  - `fatma: 5` (already ASCII-safe)
  - Include diminutives and nicknames: `memo`, `ahmo`, `hüso`
- **Source**: TÜİK most popular baby names data
- **Commit**: `feat(dict): expand common names to 200+ with turkish character variants`

### 3.2 — Expand `footballTeams` to full Süper Lig + popular lower league

- **File**: `src/dictionaries/tr.ts`
- **Action**: Add all current Süper Lig teams plus historically popular clubs. Include:
  - Missing teams: `sivasspor`, `basaksehir`, `adanademirspor`, `hatayspor`, `kasimpasa`, `istanbulspor`, `pendikspor`, `rizespor`, `samsunspor`, `gaziantepfk`, `alanyaspor`, `kayserispor`, `sakaryaspor`
  - Fan slang: `cimbom`, `kanarya`, `karakartal`, `fener`, `aslan`
  - Common fan passwords: `ultrAslan`, `sarilacivert`, `carsi`
  - More foundation years: `1966`, `1910`, `1926`
- **Commit**: `feat(dict): expand football teams with fan slang and full super lig`

### 3.3 — Add new dictionary categories

- **File**: `src/dictionaries/tr.ts`
- **Action**: Add these new categories to cover known Turkish credential stuffing patterns:
  ```typescript
  // Romantic / endearment terms (extremely common in TR passwords)
  romanticTerms: {
    askim: 1, canim: 2, hayatim: 3, sevgilim: 4, birtanem: 5,
    seniSeviyorum: 6, gonlum: 7, cicegim: 8, melegim: 9, tatliM: 10,
    bebegim: 11, kalbim: 12, ruhum: 13, gözlerim: 14, ...
  },
  // Religious / nationalistic (very common in TR)
  religiousNationalistic: {
    allah: 1, bismillah: 2, inshallah: 3, mashallah: 4,
    elhamdulillah: 5, subhanallah: 6, allahüekber: 7,
    bozkurt: 8, turkcu: 9, vatan: 10, ...
  },
  // Common Turkish password base words
  commonPasswords: {
    sifre: 1, parola: 2, giris: 3, hesap: 4, admin: 5,
    test: 6, deneme: 7, ...
  }
  ```
- **Also update** `analyzer.ts` to register these new categories in zxcvbn options
- **Commit**: `feat(dict): add romantic, religious, and common password categories`

---

## Phase 4: Performance & Architecture

### 4.1 — Lazy initialization pattern for analyzer

- **File**: `src/core/analyzer.ts`
- **Problem**: `initializeOptions()` runs at module load time (line 35), which means importing ANY export from the library triggers full dictionary loading. This breaks tree-shaking.
- **Fix**: Convert to lazy init pattern:
  ```typescript
  let initialized = false;

  const ensureInitialized = () => {
    if (initialized) return;
    // ... setOptions
    initialized = true;
  };

  export const analyzePassword = (password: string): ZxcvbnResult => {
    ensureInitialized();
    if (!password) return zxcvbn('');
    return zxcvbn(password);
  };
  ```
- **Commit**: `perf(core): convert to lazy initialization for tree-shaking support`

### 4.2 — Optimize PasswordMeter to skip hook when score provided

- **File**: `src/ui/PasswordMeter.tsx`
- **Problem**: Even when `score` is provided as a prop, `usePasswordRisk('')` still executes, calling `zxcvbn('')` unnecessarily.
- **Fix**: Pass a sentinel value to `usePasswordRisk` that triggers an early return:
  ```typescript
  // In usePasswordRisk.ts, add early return:
  if (!password) return { score: 0 as PasswordScore, feedback: { warning: '', suggestions: [] }, crackTimeDisplay: '', raw: zxcvbn('') };
  ```
  This way, when PasswordMeter passes `''`, the hook returns instantly from memo cache.
- **Commit**: `perf(ui): avoid unnecessary zxcvbn computation when score prop provided`

---

## Phase 5: Test Coverage Expansion

### 5.1 — Expand unit tests for analyzer

- **File**: `src/__tests__/analyzer.test.ts` [NEW]
- **Action**: Create comprehensive tests:
  ```
  - Empty string → score 0
  - Very long random string (50+ chars) → score 4
  - Unicode / emoji password → no crash, returns result
  - Turkish name "mehmet" → score ≤ 1
  - Turkish name with numbers "mehmet123" → score ≤ 2
  - Football team + year "galatasaray1905" → score ≤ 2
  - City plate "34istanbul" → score ≤ 2
  - Keyboard walk "qweasd" → score ≤ 1
  - Cultural keyword "ataturk" → score ≤ 1
  - Romantic term "askim123" → score ≤ 2
  - Strong password "Tr!5strong_P@ssw0rd_99" → score 4
  - All new dictionary categories produce lower scores than random strings
  ```
- **Commit**: `test(core): add comprehensive analyzer unit tests`

### 5.2 — Add hook tests

- **File**: `src/__tests__/usePasswordRisk.test.ts` [NEW]
- **Action**: Test the hook using `@testing-library/react` (renderHook):
  ```
  - Returns correct score for weak password
  - Returns correct score for strong password
  - Memoizes result for same password (reference equality)
  - crackTimeDisplay is a non-empty string for non-empty password
  - raw property contains full zxcvbn result
  ```
- **Note**: May need to add `@testing-library/react` as devDependency
- **Commit**: `test(hooks): add usePasswordRisk hook tests`

### 5.3 — Add PasswordMeter render tests

- **File**: `src/__tests__/PasswordMeter.test.tsx` [NEW]
- **Action**: Test with `@testing-library/react-native`:
  ```
  - Renders without crashing with password prop
  - Renders without crashing with score prop
  - Score 0 produces red color
  - Score 4 produces green color
  ```
- **Note**: May need to add `@testing-library/react-native` as devDependency
- **Commit**: `test(ui): add PasswordMeter render tests`

### 5.4 — Remove old test file

- **File**: `src/__tests__/index.test.tsx` → migrate useful tests to `analyzer.test.ts`, then delete
- **Commit**: `refactor(test): reorganize tests into per-module files`

---

## Phase 6: Package.json & Config Cleanup

### 6.1 — Fix `keywords` for NPM discoverability

- **File**: `package.json`
- **Action**: Replace generic keywords with descriptive ones:
  ```json
  "keywords": [
    "react-native", "password", "security", "strength", "meter",
    "zxcvbn", "turkish", "nist", "password-strength",
    "password-intelligence", "ios", "android"
  ]
  ```
- **Commit**: `chore(deps): improve npm keywords for discoverability`

### 6.2 — Clean `files` field (remove phantom native folders)

- **File**: `package.json`
- **Action**: Remove references to `android`, `ios`, `cpp`, `*.podspec`, `react-native.config.js` since this is a pure JS library with no native code:
  ```json
  "files": [
    "src",
    "lib",
    "!**/__tests__",
    "!**/__fixtures__",
    "!**/__mocks__",
    "!**/.*"
  ]
  ```
- **Commit**: `chore(deps): remove phantom native entries from files field`

### 6.3 — Fix lefthook.yml glob spaces

- **File**: `lefthook.yml`
- **Problem**: Line 10 has `"*.{js,ts, jsx, tsx}"` with spaces after commas, which may break glob matching.
- **Fix**: `"*.{js,ts,jsx,tsx}"` (no spaces)
- **Commit**: `fix(ci): remove spaces from lefthook glob patterns`

### 6.4 — Fix turbo.json input globs

- **File**: `turbo.json`
- **Problem**: `src/*.ts` and `src/*.tsx` only match root-level files, not subdirectories like `src/core/analyzer.ts`.
- **Fix**: Change to `src/**/*.ts` and `src/**/*.tsx`
- **Commit**: `fix(ci): use recursive globs in turbo input patterns`

---

## Phase 7: Documentation Polish

### 7.1 — Fix CODE_OF_CONDUCT.md placeholder

- **File**: `CODE_OF_CONDUCT.md`
- **Problem**: Line 64 contains `[INSERT CONTACT METHOD]`
- **Fix**: Replace with actual contact email: `mobilteknolojileri@gmail.com`
- **Commit**: `docs: add contact email to code of conduct`

### 7.2 — Rewrite README.md to star-worthy quality

- **File**: `README.md`
- **Action**: Complete rewrite with:
  1. **Shield badges**: npm version, CI status, license, bundle size, TypeScript
  2. **Hero section**: One-liner + what problem this solves
  3. **Motivation / Why this library?**: Explain the Turkish password problem (credential stuffing with local patterns)
  4. **Feature list** with icons
  5. **Installation** (with peer dependency note)
  6. **Quick Start**: Drop-in component + headless hook (already exists, keep)
  7. **API Reference Table**: `analyzePassword()`, `usePasswordRisk()`, `<PasswordMeter />` with prop types
  8. **Turkish Intelligence**: What patterns are detected (table format)
  9. **NIST 800-63B Compliance**: Brief explanation
  10. **Contributing** link
  11. **License**
  12. **Remove** the false "Asynchronous analysis" claim
  13. **Remove** the "Minimal Footprint" claim (or rephrase honestly)
- **Commit**: `docs(readme): comprehensive rewrite with api reference and badges`

### 7.3 — Update example app to showcase all features

- **File**: `example/src/App.tsx`
- **Action**: Enhance demo to show:
  - Score label text ("Very Weak" / "Weak" / "Fair" / "Good" / "Strong")
  - Detection category (which dictionary matched)
  - Try-it suggestions for Turkish patterns
- **Commit**: `feat(example): enhance demo with score labels and detection info`

---

## Phase 8: Final Verification

### 8.1 — Run full CI pipeline locally
```bash
yarn typecheck    # Must pass with zero errors
yarn lint         # Must pass with zero warnings
yarn test         # All tests must pass
yarn prepare      # bob build must produce lib/ output
```

### 8.2 — Verify zxcvbn-ts integration manually
- Test that `analyzePassword('mehmet')` returns score ≤ 1 (name detected)
- Test that `analyzePassword('galatasaray1905')` returns score ≤ 2 (team + year)
- Test that `analyzePassword('qweasd')` returns score ≤ 1 (keyboard walk)
- Test that `analyzePassword('askim123')` returns score ≤ 2 (romantic term)
- Test that `analyzePassword('Xk9#mP2$vL7@nQ')` returns score 4 (strong)

### 8.3 — Verify example app runs
```bash
yarn example start  # Expo dev server should start
```

### 8.4 — Review all exports
```bash
# Verify that TypeScript declarations are generated correctly
yarn prepare
# Check lib/typescript/src/index.d.ts exists and exports all types
```

---

## Execution Status

- [x] **Phase 1**: Critical Bug Fixes
  - [x] 1.1 — Fix dictionary format to frequency-ordered strategy
  - [x] 1.2 — Remove broken `graphs` override
  - [x] 1.3 — Fix `analyzePassword` return type
- [x] **Phase 2**: TypeScript Hardening
  - [x] 2.1 — Create shared types file
  - [x] 2.2 — Apply types to `usePasswordRisk`
  - [x] 2.3 — Improve `PasswordMeterProps` with discriminated union
  - [x] 2.4 — Rename `index.tsx` → `index.ts` and export types
- [x] **Phase 3**: Turkish Intelligence Expansion
  - [x] 3.1 — Expand `commonNames` and added `commonSurnames`
  - [x] 3.2 — Expand `footballTeams` to full Süper Lig
  - [x] 3.3 — Add romantic, religious, and common password categories
- [x] **Phase 4**: Performance & Architecture
  - [x] 4.1 — Lazy initialization pattern
  - [x] 4.2 — Optimize PasswordMeter hook call
- [x] **Phase 5**: Test Coverage
  - [x] 5.1 — Comprehensive analyzer tests
  - [x] 5.2 — Hook tests
  - [x] 5.3 — PasswordMeter render tests
  - [x] 5.4 — Reorganize test files
- [x] **Phase 6**: Package & Config Cleanup
  - [x] 6.1 — Fix keywords
  - [x] 6.2 — Clean files field
  - [x] 6.3 — Fix lefthook glob
  - [x] 6.4 — Fix turbo globs
- [x] **Phase 7**: Documentation Polish
  - [x] 7.1 — Fix CODE_OF_CONDUCT placeholder
  - [x] 7.2 — Rewrite README
  - [x] 7.3 — Update example app
- [x] **Phase 8**: Final Verification
  - [x] 8.1 — Run full CI pipeline locally
  - [x] 8.2 — Verify zxcvbn-ts integration manually
  - [x] 8.3 — Example app runs
  - [x] 8.4 — Review all exports
