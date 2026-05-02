# Architecture

This document captures the design rationale behind `react-native-password-intelligence`. It exists so a reviewer can understand *why* the code looks the way it does without reading every commit message.

## One-paragraph summary

The library is a thin Turkish-aware adapter over [`@zxcvbn-ts/core`](https://github.com/zxcvbn-ts/zxcvbn). Three public entry points (`analyzePassword`, `usePasswordRisk`, `<PasswordMeter />`) are layered: the pure function does the work, the hook adds React memoization, and the UI component adds an animated bar. A single Turkish dictionary file feeds zxcvbn through a small `analyzer.ts` that handles initialization, custom-dictionary state, input safety, and dual-locale case-folding.

## Module layout

```
src/
├── core/
│   └── analyzer.ts          # zxcvbn lifecycle, input guards, dual-normalize, custom dict
├── dictionaries/
│   └── tr.ts                # Turkish entries + buildDictionary helper
├── translations/
│   └── tr.ts                # Inline Turkish feedback strings (zxcvbn TranslationKeys shape)
├── hooks/
│   └── usePasswordRisk.ts   # Value-based memoized React hook
├── ui/
│   └── PasswordMeter.tsx    # Animated bar, score-mode shortcut
├── types.ts                 # Public TypeScript types
└── index.ts                 # Public API barrel
```

## Five design choices that drive the code

### 1. Deferred zxcvbn initialization

zxcvbn's `setOptions` is a one-time, side-effecting call that builds ranked dictionaries. We register the options on the first `analyzePassword` invocation, not at module import. Reasoning:

- A consumer who imports `analyzePassword` but never calls it (e.g., behind a feature flag) pays no setup cost.
- Combined with `sideEffects: false` in `package.json`, this means a screen that only uses `<PasswordMeter score={s} />` (precomputed score) doesn't even bundle the analyzer.

The dictionary *arrays* themselves are still built at module import (eager `buildDictionary` calls in `dictionaries/tr.ts`). True lazy dictionary loading via dynamic `import()` is a v0.4.0 candidate; the trade-off is async API surface vs cold-start cost.

### 2. Dual-locale case-folding

Plain JavaScript `'İ'.toLowerCase()` returns `'i̇'` (lowercase i + combining dot above), which does **not** match a dictionary entry of `'i'` plus the rest of the word. Conversely, `'IBRAHIM'.toLocaleLowerCase('tr-TR')` becomes `'ıbrahım'` (dotless ı), which fails to match a dictionary entry of `'ibrahim'` (regular i).

The library evaluates both case-foldings and returns the more pessimistic (lower-scoring) zxcvbn result. The two paths only diverge when the input contains uppercase `'I'` or `'İ'`, so the second zxcvbn call is paid rarely. This catches both keyboard layouts in normal use.

### 3. Bounded, dedup-on-write custom dictionary

`addCustomDictionary(words)` merges into a `Set<string>` rather than pushing into an array. Idempotency is "free" via Set semantics. The set is hard-capped at 10,000 entries with a `console.warn` to prevent unbounded growth in long-running mobile or SSR processes that might accidentally call the API in a render path. `clearCustomDictionary()` is exposed for test isolation and multi-tenant SSR.

### 4. Discriminated-union `<PasswordMeter />` props

```ts
type PasswordMeterProps =
  | { password: string; userInputs?: ...; score?: never }
  | { score: PasswordScore; password?: never; userInputs?: never };
```

Two reasons:

- It's a TypeScript error to provide neither prop. A reviewer can grep for `PasswordMeter` and know every usage is well-formed.
- The component splits internally into `PasswordMeterBar` (the animated bar) and `AnalyzedPasswordMeterBar` (which calls the hook). When `score` is provided directly, only the bar renders — the hook is never called, and the analyzer is never initialized. This makes precomputed-score usage strictly free of zxcvbn cost.

### 5. Value-based hook memoization

React `useMemo` checks dependencies by reference. If a consumer writes:

```tsx
<PasswordMeter password={pw} userInputs={[user.firstName, user.email]} />
```

…the inline array has a new identity every render, which would cause the hook to recompute every render and (for some consumers) infinitely re-render. We sidestep this by computing `inputsKey = JSON.stringify(userInputs)` and using the string as the memoization dependency. The closure body deserializes the key with `JSON.parse(inputsKey)` so we never read the outer `userInputs` reference inside the memo — no stale-closure risk and no `eslint-disable` directive.

## Categorization rationale (`src/dictionaries/tr.ts`)

Eleven categories. Each one corresponds to a documented threat-intelligence pattern in publicly disclosed Turkish password breach corpora:

| Category | Why it earns its own entry |
|---|---|
| `commonNames` | First names dominate Turkish breach top-100s. |
| `commonSurnames` | TÜİK / NVI top-surname distribution maps directly to password reuse. |
| `footballTeams` | Galatasaray / Fenerbahçe / Beşiktaş founding years are heavily reused. |
| `cityNames` | Province-of-residence appears in low-effort password choices. |
| `platePatterns` | Plate-code + city is a culturally-specific composite pattern. |
| `keyboardWalks` | Universal but worth keeping in the Turkish set so `qweasd` is flagged out of the box. |
| `culturalKeywords` | Republic-era dates (1453, 1923) and national symbols. |
| `romanticTerms` | "aşkım", "canım", "hayatım" rank above name-only passwords in some breach datasets. |
| `religiousNationalistic` | Threat-intel category. Inclusion reflects observed compromise data; not endorsement. Documented inline. |
| `zodiacSigns` | Birth-related passwords. Twelve-entry list. |
| `brands` | Telecom, banking, retail, online-services brand names appear in 3–5% of Turkish breach samples. |

Each raw array is fed through `buildDictionary`, which generates four variants per entry (base, compact, ASCII fallback, compact ASCII). Variants are deduplicated within a category via a `Set`. A future addition could deduplicate across categories, but the runtime cost of zxcvbn matching the same token across multiple ranked dictionaries is negligible.

## Why a single locale (today)

The library is published as Turkish-first, not "i18n-extensible." This is a deliberate trade-off:

- **For the user**: deep Turkish coverage now beats shallow multi-locale stubs that don't actually catch breach-corpus patterns.
- **For the maintainer**: a one-locale build avoids designing a plugin API before the second locale exists. (The "second-system effect" is real.)
- **For the future**: when a second locale is ready (Arabic and Persian are the natural candidates given the user base), the architecture refactor becomes a v0.4.0 work item: rename `dictionaries/tr.ts` to `dictionaries/tr/index.ts`, add a `Locale` interface, expose `setLocale()` or `addLocale()` as a public API, register dictionaries dynamically.

Until then, "locale extension" means contributing Turkish dictionary entries (PRs welcome) or forking with a new dictionary file.

## Performance budget

- **First analysis (cold)**: ~30–80 ms on a mid-range Android device. Dominated by `buildDictionary` (eager array construction) plus `zxcvbnOptions.setOptions` (rank-table build).
- **Subsequent analysis (warm)**: ~1–10 ms typical, ~50 ms worst case for inputs that hit both the standard and Turkish-locale case-fold paths.
- **Hook re-render (same input)**: a single `JSON.parse` of the cached key string. Effectively free.
- **`<PasswordMeter score={s} />`**: no analyzer cost. Animation only.
- **Bundle size**: ~30 KB minified for the full library. The `commonDictionary` from `@zxcvbn-ts/language-common` adds ~200 KB unminified but is shared with any other zxcvbn-ts consumer in the same bundle.

## Test strategy

127+ tests covering:

- Score thresholds for representative inputs in every dictionary category.
- Turkish Unicode edge cases (dotted/dotless I both keyboard layouts, NFC/NFD, surrogate emoji, RTL override, paste-with-newline).
- `addCustomDictionary` idempotency, bounded growth, empty-input handling, and `clearCustomDictionary` round-trip.
- Long-input safety (50 KB pathological paste, 2,048-char input, behavioral truncation verification).
- Malformed-input type guards (null, undefined, number, object).
- React hook memoization (reference vs value, inline array stability).
- `<PasswordMeter />` score-mode shortcut (analyzer NOT called when score prop is provided, verified via jest mock-call inspection).
- A 30-input score-regression snapshot fixture so deliberate dictionary or scoring shifts must be reviewed and acknowledged.

Coverage is gated at 85% lines / 80% functions / 75% branches / 85% statements. Actual numbers track 99 / 100 / 94 / 99 at v0.3.0 release.

## Release safety

- `prepublishOnly` runs `yarn lint && yarn typecheck && yarn test && yarn prepare` before any `npm publish`.
- The release workflow (`.github/workflows/release.yml`) runs the same gauntlet plus `npm pack --dry-run` and publishes with `--provenance` and OIDC `id-token: write` so SLSA attestation lands on every tarball.
- Dependabot proposes weekly dependency PRs (root, example workspace, GitHub Actions).
- The `score-regression` snapshot fixture is a dictionary-update tripwire: any PR that shifts a pinned score must update the fixture intentionally, which surfaces in code review.

## What's intentionally out of scope

- Password generation (would require a CSPRNG-backed entropy source and policy engine).
- Server-side validation (the score is a UX hint, not an authorization gate).
- Storage / hashing (use `bcrypt`, `argon2`, or your auth provider).
- Multi-locale plugin API (v0.4.0).
- Dynamic-import lazy dictionary loading (v0.4.0; needs an async API surface).
- Profanity dictionary (curatorial overhead and abuse-policy risk outweigh threat-intel value at this scale).
