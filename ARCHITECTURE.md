# Architecture

This document captures the design rationale behind `password-intelligence` and
`react-native-password-intelligence`. It exists so a reviewer can understand *why* the code looks
the way it does without reading every commit message.

## One-paragraph summary

`password-intelligence` is a thin Turkish-aware adapter over
[`@zxcvbn-ts/core`](https://github.com/zxcvbn-ts/zxcvbn): a pure `analyzePassword` function, a
module-global configuration layer (`configure`, custom dictionary) and one Turkish dictionary file
that feeds zxcvbn twelve categories. `react-native-password-intelligence` re-exports that entire
surface and adds two React bindings: `usePasswordRisk` (memoized, subscribed to the engine) and
`<PasswordMeter />` (animated bar). The wrapper contains no zxcvbn code of its own.

## Repository layout

```
packages/
├── core/                              # password-intelligence (no react / react-native)
│   ├── src/
│   │   ├── core/
│   │   │   ├── engine.ts              # options assembly, validation, dirty flag, subscriptions
│   │   │   ├── analyzer.ts            # analyzePassword, custom dictionary API, warning fill-in
│   │   │   └── turkishCase.ts         # the single Turkish fold used by every dictionary side
│   │   ├── dictionaries/tr.ts         # curated source terms → four match variants each
│   │   ├── translations/tr.ts         # zxcvbn TranslationKeys + dictionaryWarnings
│   │   ├── data/*.generated.ts        # top-4,000 English passwords + keyboard graphs (vendored)
│   │   ├── types.ts                   # public types
│   │   └── index.ts                   # public barrel (exact set pinned by publicApi.test.ts)
│   └── scripts/generate-data.mjs      # regenerates src/data from @zxcvbn-ts/language-common
└── react-native/                      # react-native-password-intelligence
    └── src/
        ├── hooks/usePasswordRisk.ts   # value-memoized hook + useSyncExternalStore
        ├── ui/PasswordMeter.tsx       # animated bar, score-mode shortcut
        └── index.ts                   # `export * from 'password-intelligence'` + bindings
scripts/
├── check-size.mjs                     # gzip budget on the core ESM output
├── check-pack.mjs                     # every manifest entry point is in the tarball
└── sync-versions.mjs                  # lockstep versions for release-it / CI
```

Build is `react-native-builder-bob` per package (CJS + ESM + two `.d.ts` trees), orchestrated by
turbo so the wrapper always builds after the core. Tests run from one root Jest config with two
projects: `core` under a plain Node environment (the proof that the core has no React Native
dependency) and `react-native` under the RN preset, with `password-intelligence` mapped to the
core source.

## Design choices that drive the code

### 1. Lazy, dirty-flagged zxcvbn options

zxcvbn keeps its options in a module-level singleton and `setOptions` is a side-effecting call
that builds ranked dictionaries. Registering eagerly at import time would pull every dictionary
into the module graph; requiring an explicit `init()` would create a "call this first" trap.
Instead `configure()`, `addCustomDictionary()` and friends only record intent and set a dirty
flag; the next `analyzePassword()` applies the assembled options synchronously and clears it.

Consequences that are easy to get wrong, and are therefore pinned by tests:

- `buildOptions()` emits **every** option including defaults. `Options.setOptions` only assigns
  the keys it is given, so an omitted `useLevenshteinDistance` would keep the previous value and
  `resetConfiguration()` could never revert it.
- `configure()` **validates before recording**. zxcvbn's `setOptions` installs the dictionary
  before it validates the translations, so a bad `translations` object applied lazily would poison
  every subsequent analysis while leaving the new dictionary in place. Validation throws from
  `configure()` itself and leaves the current configuration untouched.
- Every state change bumps a revision counter and notifies subscribers
  (`subscribeToConfiguration` / `getConfigurationVersion`). The hook reads it through
  `useSyncExternalStore`, so a `configure()` that lands after the first render (typically once
  `@zxcvbn-ts/language-common` finishes loading) re-analyses the password already on screen.

### 2. One Turkish fold, used on both sides of a match

zxcvbn lowercases the password with `String.prototype.toLowerCase()` (Unicode default casing) and
matches it verbatim against dictionary entries. Two Turkish letters break under default casing:
dotted `İ` becomes `i` + U+0307, and ASCII `I` becomes dotted `i` where Turkish expects dotless `ı`
(`IŞIK` → `işik`, but the dictionary holds `ışık`).

0.3.0 answered this by scoring both `toLowerCase()` and `toLocaleLowerCase('tr-TR')` and taking
the lower score — which ran two analyses on every mixed-case password, destroyed the case profile
zxcvbn needs for `capitalization` / `allUppercase` feedback, and still only caught `IBRAHIM` by
accident. `core/turkishCase.ts` replaces that with two rules:

- **Dictionary side.** Every word — bundled category, `addCustomDictionary` entry or per-call
  `userInputs` string — is expanded by `expandTurkishVariants` into Turkish, compact, ASCII-folded
  and compact-ASCII forms (`Ömer Asaf` → `ömer asaf`, `ömerasaf`, `omer asaf`, `omerasaf`). The
  lowercasing is locale-independent (`I` → `ı`, `İ` → `i`, then default casing) so it does not
  depend on the engine's ICU data.
- **Password side.** `repairTurkishCase` returns the input unchanged unless default casing would
  miss: a dotted `İ`, or an ASCII `I` next to another Turkish letter. Only then is an ASCII-folded
  copy scored as a second pass. The fold keeps every character's case, the lower score wins and
  `result.password` always echoes the input.

The bundled dictionary output is byte-identical to the previous hand-written helper; the
difference is that custom words and `userInputs` now share it instead of using plain
`toLowerCase()`, which could never meet the repaired password.

### 3. Warnings that follow zxcvbn's own rules

zxcvbn only explains a dictionary match when the dictionary has one of its well-known names
(`passwords`, `lastnames`, `userInputs`, or a name containing `firstnames` / `wikipedia`).
Every other dictionary yields `warning: null`, which for a Turkish-first library means the
headline feature would reject `galatasaray` and say nothing. `analyzer.ts` fills the gap from
`translations.dictionaryWarnings` (keyed by dictionary name) using the longest matching token —
but only where zxcvbn itself would warn, i.e. never for a password that already scores 3 or 4,
and only for own properties (a consumer dictionary named `constructor` must not surface
`Object`). The Turkish first-name dictionary is named `turkish_firstnames` on purpose: the
`firstnames` substring is what makes zxcvbn explain it natively.

The warnings live inside the translations object rather than a parallel table so
`configure({ translations })` swaps the whole feedback language at once and can never produce
mixed-language feedback. (zxcvbn's `checkCustomTranslations` only requires its own keys to be
present; extra keys are fine.)

### 4. Bounded, dedup-on-write custom dictionary

`addCustomDictionary(words)` merges into a `Set<string>`, so idempotency is free, and is
hard-capped at 10,000 source words with a `console.warn` to prevent unbounded growth in
long-running mobile or SSR processes. Entries are registered as a real zxcvbn dictionary named
`custom` (applied last so nothing can shadow it), not re-spread into `userInputs` on every call,
so a large list costs nothing per keystroke. No-op additions and clears do not mark the engine
dirty. `clearCustomDictionary()` exists for test isolation and multi-tenant SSR; `resetConfiguration()`
deliberately does not touch it.

### 5. Discriminated-union `<PasswordMeter />` props

```ts
type PasswordMeterProps =
  | { password: string; userInputs?: ...; score?: never }
  | { score: PasswordScore; password?: never; userInputs?: never };
```

Providing neither prop is a type error, and the component splits into `PasswordMeterBar` (the
animated bar) and `AnalyzedPasswordMeterBar` (which calls the hook). With `score` the hook is never
called and the analyzer is never initialized, so precomputed-score usage is strictly free of
zxcvbn cost — the example app uses this to avoid analysing the same password twice.

### 6. Value-based hook memoization

`useMemo` compares dependencies by reference, so an inline `userInputs={[user.firstName]}` would
recompute every render. The hook keys on `JSON.stringify(userInputs)` and deserializes inside the
memo, so it never closes over the outer array. The configuration revision is the third key, which
is what lets a late `configure()` invalidate a result whose inputs did not change.

## Categorization rationale (`packages/core/src/dictionaries/tr.ts`)

Twelve categories. Each one corresponds to a documented threat-intelligence pattern in publicly
disclosed Turkish password breach corpora:

| Category | Why it earns its own entry |
|---|---|
| `commonNames` | First names dominate Turkish breach top-100s. Registered as `turkish_firstnames`. |
| `commonSurnames` | TÜİK / NVI top-surname distribution maps directly to password reuse. |
| `footballTeams` | Galatasaray / Fenerbahçe / Beşiktaş founding years are heavily reused. |
| `cityNames` | Province-of-residence appears in low-effort password choices. |
| `platePatterns` | Plate-code + city is a culturally-specific composite pattern. |
| `keyboardWalks` | Literal walks; the spatial matcher (six vendored layouts) covers the rest. |
| `culturalKeywords` | Republic-era dates (1453, 1923) and national symbols. |
| `romanticTerms` | "aşkım", "canım", "hayatım" rank above name-only passwords in some datasets. |
| `religiousNationalistic` | Threat-intel category. Inclusion reflects observed compromise data; not endorsement. |
| `commonPasswords` | Turkish equivalents of `password` / `admin` plus the universal top entries. |
| `zodiacSigns` | Birth-related passwords. Twelve-entry list. |
| `brands` | Telecom, banking, retail, online-services brand names appear in 3–5% of Turkish breach samples. |

Source terms are written in natural Turkish casing; `buildDictionary` derives the variants
(section 2) and deduplicates within a category while preserving first-seen order, which is what
zxcvbn ranks by.

## Bundle strategy

0.3.0 statically imported `@zxcvbn-ts/language-common` (229 kB gzip) and Metro does not
tree-shake, so every consumer paid for it. The core now vendors a frequency-ordered top-4,000
slice of the password list and the six keyboard graphs (`packages/core/src/data`, regenerated by
`generate:data` and byte-checked in CI). The measured cost is a false-strong rate under 5% on
leaked passwords beyond the cutoff (`dictionaryParity.test.ts` enforces the budget), and the fix
is two lines: `configure({ dictionaries, graphs })` with the full package loaded lazily. CI gates
the core ESM output at 40 kB gzip (`scripts/check-size.mjs`; ~34 kB today, `@zxcvbn-ts/core` adds
~20 kB).

Package exports are `import` / `require` only. A `react-native` condition pointing at the ESM
build was dropped on purpose: React Native's Jest preset resolves with `['require',
'react-native']` and would have received untransformed `export` statements. Metro still gets ESM
through `import`.

## Why a single locale (today)

The library is published as Turkish-first, not "i18n-extensible":

- **For the user**: deep Turkish coverage now beats shallow multi-locale stubs.
- **For the maintainer**: one locale avoids designing a plugin API before the second locale
  exists. `configure({ dictionaries, translations })` already lets a consumer add any corpus and
  feedback language at runtime.
- **For the future**: a first-class locale abstraction is a 1.0.0 work item (see ROADMAP.md).

## Performance budget

- **First analysis (cold)**: ~30–80 ms on a mid-range Android device — `zxcvbnOptions.setOptions`
  building the rank tables. Re-applying options after `configure()` is ~1 ms for the bundled
  dictionaries, ~8 ms with the full `language-common` set.
- **Subsequent analysis (warm)**: ~1–10 ms typical, ~50 ms worst case for inputs that trigger the
  case-repair second pass.
- **Hook re-render (same input)**: a single `JSON.parse` of the cached key. Effectively free.
- **`<PasswordMeter score={s} />`**: no analyzer cost. Animation only.

## Test strategy

210+ tests across the two Jest projects, all starting from a reset engine (`jest.setup.ts` in
each package):

- A 30-input score-regression snapshot (`analyzer.test.ts`) so deliberate dictionary or scoring
  shifts must be reviewed and acknowledged.
- Turkish case handling end to end: fold helpers, `repairTurkishCase` triggers, all-caps words with
  ASCII `I`, custom words and `userInputs` containing `İ` / `ı`.
- Feedback: every Turkish category explains itself at score 0–2 and stays silent at 3–4;
  prototype-named dictionaries are ignored.
- Configuration: validation, merge semantics, a real reset of the zxcvbn singleton, translation
  swaps that never mix languages, change notifications and their no-op cases.
- Structural guards: the exact public export set of each package, the wrapper never importing
  `@zxcvbn-ts/*` directly (a second `zxcvbnOptions` singleton would silently ignore
  `configure()`), keyboard graphs actually reaching the spatial matcher, generated data matching its
  generator, and the lite-dictionary false-strong budget.
- React bindings: value-based memoization, re-analysis on `configure()` / `addCustomDictionary()`
  after mount, and the score-mode shortcut never touching the analyzer.

Coverage is gated globally at 85% lines / 80% functions / 75% branches / 85% statements, with
`collectCoverageFrom` at the root so files no test imports still count against the gate.

## Release safety

- CI (`ci.yml`) runs lint, typecheck, generated-data verification, tests with coverage, the build,
  the gzip budget and the tarball check, then installs the packed core into a scratch project on
  Node 18/20/22/24 and exercises both `require` and `import`.
- Both packages ship in lockstep on one version. `yarn release` (release-it) bumps the root
  `package.json` and `scripts/sync-versions.mjs` propagates it to `packages/*` and to the wrapper's
  dependency range before the release commit; the release workflow refuses a tag whose packages
  disagree.
- The release workflow re-runs the full gauntlet, publishes the core before the wrapper (the
  wrapper depends on the published core) with `--provenance` via OIDC trusted publishing, and
  attaches the tarballs and SHA-256 checksums to the GitHub release. The very first publish of a
  new package name has to be done manually with a token, because npm trusted publishers can only
  be configured on a package that already exists (see CONTRIBUTING.md).
- Dependabot proposes monthly grouped dependency PRs.

## What's intentionally out of scope

- Password generation (would require a CSPRNG-backed entropy source and policy engine).
- Server-side validation (the score is a UX hint, not an authorization gate).
- Storage / hashing (use Argon2id per RFC 9106, or your auth provider).
- Multi-locale plugin API (1.0.0).
- Profanity dictionary (curatorial overhead and abuse-policy risk outweigh threat-intel value at this scale).
