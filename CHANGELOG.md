# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-09-06

### Changed

- **BREAKING (bundle + scoring): the default no longer bundles the full English password list.**
  0.3.0 statically imported `@zxcvbn-ts/language-common`, forcing **229 kB gzip** of dictionary
  data (49,233 passwords + 7,776 diceware words) into every consumer's bundle. Metro does not
  tree-shake, so React Native apps had no way to opt out. 0.4.0 vendors a frequency-ordered
  **top-4,000** slice instead. The published bundle drops from **236.3 kB to ~37 kB gzip (6x
  smaller)** for the core package's own code (`@zxcvbn-ts/core` adds ~20 kB either way).

  **What this costs you:** passwords ranked 4,000-49,233 no longer match. Measured over a sample
  of 1,223 real leaked passwords beyond the cutoff, **3.4% now score 3 or higher** (0% with the
  full list). Restore full parity in two lines:

  ```sh
  yarn add @zxcvbn-ts/language-common
  ```
  ```ts
  import { configure } from 'react-native-password-intelligence';
  import { dictionary, adjacencyGraphs } from '@zxcvbn-ts/language-common';

  configure({ dictionaries: dictionary, graphs: adjacencyGraphs });
  ```

  If you gate account creation on `score >= 3`, either restore the full dictionary or move the
  check server-side against a breach corpus (HIBP k-anonymity).

  **The diceware list went with it, and it has no lite replacement.**
  `@zxcvbn-ts/language-common` shipped two dictionaries, not one: `passwords` (49,233) and
  `diceware` (7,776). Only `passwords` was replaced by a frequency-ordered slice. Diceware words
  are equiprobable and the list is in dice order, so a prefix would just be "the ones starting with
  a-f", and vendoring all of it costs 25 kB gzip - which would blow the 40 kB budget the shrink
  exists to defend. Measured on a stride sample of the full list, **about one diceware word in five
  now scores 3 or higher** (0% before), and a two-word passphrase such as `abacusflagon` scores 4
  where the full dictionary gave 3. If your users pick diceware or EFF-wordlist passphrases,
  restore the full dictionary with the two lines above. The regression is pinned by
  `dictionaryParity.test.ts` so it cannot drift unnoticed.

- **Passwords are no longer lowercased before scoring.** 0.3.0 scored both `toLowerCase()` and
  `toLocaleLowerCase('tr-TR')` and returned the lower score, which discarded uppercase entropy on
  every mixed-case password and made zxcvbn's `capitalization` / `allUppercase` suggestions
  unreachable. Mixed-case passwords now score **higher** (correctly): `SunFlower77` 2 -> 3,
  `QwErTy123` 0 -> 1. Turkish detection is unaffected - see the `İ` repair under *Fixed*.

- **Input is normalised to NFC before analysis.** `result.password` therefore echoes the composed
  form of what you passed, which renders identically but may differ in code-unit length from an
  NFD input. This is what makes decomposed Turkish letters work at all - see *Fixed*.

- **`maxLength` now defaults to 256, not 1,024.** This matches `@zxcvbn-ts/core`'s own default, and
  the value is now propagated to the zxcvbn singleton so the two limits cannot disagree. The
  matcher's cost grows steeply with length: at the old cap a single call took ~6.6 s on a desktop,
  at 256 it is ~1.2 s. Nothing realistic changes score, since any 256-character password already
  scores 4. Pass `configure({ maxLength })` if you need the old ceiling.

- **`configure({ graphs })` merges instead of replacing**, both over the bundled layouts and
  across repeated calls — matching how `dictionaries` already behaved. Registering one custom
  layout used to silently disable spatial matching for all six bundled layouts, and a second
  `configure({ graphs })` call used to drop the layout added by the first. If you were relying on
  the replacement behaviour to *remove* a bundled layout, that no longer works.

- **A `configure()` key set to `undefined` is ignored rather than reset.** `configure({ maxLength:
  props.max })` with an optional prop used to silently widen a limit that had been narrowed on
  purpose. `dictionaries` already behaved this way; every key is now consistent. Use
  `resetConfiguration()` to revert.

- **Consumer dictionaries passed to `configure({ dictionaries })` are now case-folded** the same
  way the bundled categories are. zxcvbn matches entries verbatim against a default-lowercased
  password, so an entry written `AcmeHolding` previously matched nothing at all, silently.

- `raw.sequence[].dictionaryName` for custom-dictionary hits changed from `userInputs` to `custom`,
  and the Turkish first-name dictionary is now `turkish_firstnames` instead of `turkish_names`
  (`firstnames` in the name is what makes zxcvbn explain the match). The other `turkish_*` names
  are unchanged.

### Added

- **New package [`password-intelligence`](https://www.npmjs.com/package/password-intelligence)** -
  the same engine with **no react or react-native dependency**, for Node, Next.js, plain React and
  any other JS runtime. `react-native-password-intelligence` is now a thin wrapper around it and
  re-exports the entire core surface, so existing imports keep working unchanged.

  | You are building | Install |
  |---|---|
  | React Native / Expo app | `react-native-password-intelligence` |
  | Node backend, Next.js, plain React, CLI | `password-intelligence` |

- **CommonJS output.** 0.3.0 shipped ESM only with `main` pointing at an ESM file, so
  `require('react-native-password-intelligence')` threw. Both packages now ship CJS + ESM with
  `import`/`require` export conditions, plus a top-level `module` field (which is also what
  Bundlephobia's "exports ES6 modules" check reads). There is deliberately no `react-native`
  condition: React Native's Jest preset resolves with `['require', 'react-native']` and a
  `react-native` condition pointing at the ESM build would hand it untransformed `export`
  statements. Metro (`import`) still gets ESM.

- **`configure(config)` and `resetConfiguration()`** for swapping dictionaries, keyboard graphs,
  translations and `maxLength`. Valid at any time, including after the first analysis - options are
  re-applied lazily, so there is no "call this first" trap and `analyzePassword` stays synchronous.
  Options are validated synchronously: an invalid `maxLength`, `translations` or dictionary throws
  from `configure()` itself and leaves the current configuration untouched. `translations` accepts
  an optional `dictionaryWarnings` map so the Turkish-category warnings are translated together
  with zxcvbn's own strings (and never mixed with them).

- **`subscribeToConfiguration(listener)` and `getConfigurationVersion()`** for consumers that cache
  results. `usePasswordRisk` (and therefore `<PasswordMeter password>`) subscribes, so a
  `configure()` or `addCustomDictionary()` call that lands after the first render re-analyses the
  password on screen instead of leaving a stale score.

- **A `Standards` section in the README** describing how the library maps onto NIST SP 800-63B
  §3.1.1.2 (blocklist + subscriber guidance), and where the client/server boundary lies.

### Fixed

- **`clearCustomDictionary` is now exported.** It was documented in the 0.3.0 README as public API
  but was missing from the barrel, so the documented import failed. `PasswordMeterProps` was
  likewise documented as exported and is now genuinely exported.

- **Keyboard-walk detection actually works.** The engine never passed `graphs` to
  `zxcvbnOptions.setOptions`, and zxcvbn defaults to `graphs = {}`, so the spatial matcher produced
  zero matches - the advertised feature was dead. Walks that are not literal dictionary entries were
  scored as if random: `xcvbnm,./` 3 -> 1, `qwertzuiop` 2 -> 1, `tgbnhyujm` 3 -> 2.

- **Turkish matches now explain themselves.** zxcvbn only emits a dictionary warning for its own
  well-known dictionary names, so all twelve Turkish categories returned `feedback.warning: null` -
  the library's headline feature scored a password 0 and told the user nothing.
  `galatasaray`, `mehmet`, `istanbul`, `askim`, `turkcell` and the rest now return category-specific
  Turkish warnings. **If you branch on `warning === null`, that branch changes behaviour.**

- **Turkish case handling is both more correct and cheaper.** The old dual-locale fold ran a
  second full analysis on every mixed-case password; worse, `toLocaleLowerCase('tr-TR')` maps ASCII
  `I` to dotless `ı`, so `IBRAHIM` and `ISTANBUL34` only scored correctly by accident. The password
  is now scored as typed, and an ASCII-folded copy is scored only when Unicode default casing would
  miss a Turkish entry: a dotted `İ` (which lowercases to `i` + U+0307) or an ASCII `I` next to
  another Turkish letter (`ŞANLIURFA` lowercases to `şanliurfa`, matching neither `şanlıurfa` nor
  `sanliurfa`). Custom dictionary words and per-call `userInputs` go through the same fold as the
  bundled categories, so `addCustomDictionary(['İkbalcan'])` matches `ikbalcan`, `IKBALCAN` and
  `İkbalcan` alike.

- **Turkish category warnings respect zxcvbn's score gate.** They are only added where zxcvbn
  itself would warn (score 0-2), so a strong passphrase that happens to contain `istanbul` no
  longer shows a warning under a green meter.

- **`resetConfiguration()` really resets.** `useLevenshteinDistance` / `levenshteinThreshold` were
  only ever written to the zxcvbn singleton when set, so a reset could not revert them.

- **`yarn release` bumps every package.** release-it only bumps the root `package.json`;
  `scripts/sync-versions.mjs` now propagates the version and the wrapper's dependency range in its
  `after:bump` hook, and the release workflow refuses a tag whose packages disagree.

- **The custom dictionary is registered once, not re-spread on every keystroke.** 0.3.0 spread up to
  10,000 entries into `userInputs` on every call; entries are now a real zxcvbn dictionary applied
  on change (measured: 1,200 analyses 17.9 s -> 14.5 s at the 10k cap).

- **Decomposed (NFD) Turkish letters are matched.** `S` + U+0327 and friends reached no matcher at
  all, so text pasted from a macOS or iOS clipboard scored as if it were random: `GÜMÜŞHANE` scored
  **4** in NFD against 0 composed, `ŞANLIURFA` 3 against 0, `ÖZTÜRK` 2 against 0. Any `score >= 3`
  signup gate was bypassable by pasting rather than typing.

- **`userInputs` entries that are not strings or numbers are dropped instead of thrown on.**
  zxcvbn calls `.toString()` on every entry, so a `null` - which `usePasswordRisk` manufactures out
  of `undefined` or `NaN` through its JSON round-trip - crashed the render tree. The README's own
  `[user.firstName, user.email]` pattern threw while a profile was still loading.

- **An invalid dictionary or graph is rejected by `configure()` rather than by every later
  analysis.** `configure({ dictionaries: { list: ['a', null] } })` and
  `configure({ graphs: { bad: null } })` were both accepted, and every subsequent
  `analyzePassword` then threw permanently - the dirty flag is only cleared after `setOptions`
  returns, so nothing short of `resetConfiguration()` recovered.

- **The case-repair pass compares guess counts, not score bands.** The five-bucket score ties
  constantly, and on a tie the un-repaired analysis won: `İstanbul-2024-Xq7` reported 3.0e15
  guesses instead of 1.0e11, with the Turkish city match missing from `sequence` entirely.

- **`addCustomDictionary` deduplicates on the folded form.** `Acme`, `ACME` and `acme ` build the
  same entries but each consumed a slot of the 10,000 cap and bumped the configuration revision,
  re-ranking the dictionary and re-rendering every mounted meter three times over.

- **One engine state across the CJS and ESM builds.** A bundler resolving `import` to one build and
  `require` to the other loaded both into the same realm - two copies of the configuration over one
  shared zxcvbn singleton, so a word registered through `addCustomDictionary` could come back
  scoring 4. State now lives behind a `Symbol.for` key on `globalThis`.

- **zxcvbn defaults this library never sets are re-emitted on every apply**, so `l33tTable` and
  `l33tMaxSubstitutions` written by application code can be reverted by `resetConfiguration()`, and
  a foreign `setOptions()` write is detected and overwritten rather than persisting silently.

- **Match offsets index the password that is echoed back.** Where the repair collapses `i` + U+0307
  into one character, `sequence[].i`/`.j` addressed the shorter repaired string, so a consumer
  highlighting matched spans underlined the wrong characters.

- **Stale `userInputs` no longer leak between calls.** zxcvbn leaves the previous call's user inputs
  active when the argument is omitted; `analyzePassword` now always passes an array.

- Corrected the standards claims. The 0.3.0 README stated the score scale *"follows NIST SP 800-63B
  entropy guidelines"* - 800-63B defines no such scale and §3.1.1.2 explicitly moves away from
  entropy and composition rules. Storage guidance now follows the OWASP Password Storage Cheat
  Sheet ordering (Argon2id per RFC 9106 first, bcrypt for legacy systems only).

- Corrected the tree-shaking claim in the README and ARCHITECTURE: `sideEffects: false` never
  removed the `language-common` import, because deferring the *call* does not defer the *import*.

### Migration from 0.3.x to 0.4.0

1. **No import changes are required.** `react-native-password-intelligence` re-exports the full core
   surface.
2. **Re-baseline any score assertions in your own tests.** Mixed-case passwords score higher,
   keyboard walks score lower, and passwords beyond the top-4,000 English list score higher.
3. **Check any `feedback.warning === null` branches** - Turkish matches now return a string at
   score 0-2 (never at 3-4, like zxcvbn's own warnings).
4. **Decide on the dictionary trade-off.** Keep the 5.2x smaller default, or restore full coverage
   with `configure()` as shown above.
5. If you `require()`d the package and worked around the ESM-only build, you can drop the
   workaround.
6. `configure()` now throws synchronously on an invalid option instead of failing inside the next
   `analyzePassword` call. If you switched the feedback language via `zxcvbnOptions.setOptions`,
   use `configure({ translations })` - direct `setOptions` calls are overwritten the next time the
   engine re-applies its options.

The 30-input score-regression snapshot in `analyzer.test.ts` is **unchanged** - all 30 pinned
fixtures score identically before and after every change in this release.

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

[0.4.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.4.0
[0.3.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.3.0
[0.2.2]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.2.2
[0.2.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.2.0
[0.1.0]: https://github.com/mobilteknolojileri/react-native-password-intelligence/releases/tag/v0.1.0
