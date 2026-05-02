<div align="center">

# Password Intelligence

**Turkish-first, culturally-aware password strength kit for React Native.**  
*Combines NIST entropy estimation with regional threat intelligence.*

[![npm version](https://img.shields.io/npm/v/react-native-password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/react-native-password-intelligence)
[![npm downloads](https://img.shields.io/npm/dm/react-native-password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/react-native-password-intelligence)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-native-password-intelligence?style=flat-square&label=min%2Bgzip)](https://bundlephobia.com/package/react-native-password-intelligence)
[![CI](https://img.shields.io/github/actions/workflow/status/mobilteknolojileri/react-native-password-intelligence/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/mobilteknolojileri/react-native-password-intelligence/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square)](https://reactnative.dev/)

</div>

---

## Contents

- [The mission](#the-mission-regional-intelligence)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Contextual intelligence](#contextual-intelligence)
- [API reference](#api-reference)
- [Score scale](#score-scale)
- [What this is not](#what-this-is-not)
- [Comparison](#comparison)
- [Engineering details](#engineering-details)
- [Migration & changelog](#migration--changelog)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## The Mission: Regional Intelligence

Standard password meters treat `password123` as weak but often miss regional patterns like `mehmet1907`, `karakartal`, or `askim34`. These "cultural" passwords are among the most common found in regional data breaches.

**Password Intelligence** wraps the industry-standard [zxcvbn-ts](https://github.com/zxcvbn-ts/zxcvbn) engine and adds a Turkish-specific intelligence layer. Today it ships one locale (Turkish) deeply, not many locales superficially — see [Engineering details](#engineering-details) for the architecture rationale.

### Turkish intelligence layer

| Category | Detections & examples |
|---|---|
| Common names | `mehmet`, `ayşe`, `fatma`, `burak`, `memo`, `nizipliibo` |
| Common surnames | `yılmaz`, `kaya`, `demir`, `çelik`, `öztürk` (382 entries from TÜİK / NVI) |
| Football culture | Major clubs (`cimbom`, `fenerbahçe`, `beşiktaş`) and fan terms |
| City plate patterns | Plate codes (`34`, `06`, `27`) and city names (`istanbul34`, `ankara06`) |
| Cultural / historic | `atatürk`, `1453`, `1923`, `cumhuriyet`, `türkiye` |
| Romantic & social | `aşkım`, `canım`, `hayatım`, `birtanem` |
| Religious / ideological | Threat-intel category — terms observed in Turkish breach corpora |
| Zodiac signs | `koç`, `aslan`, `başak`, `akrep`, `oğlak` |
| Brands | `turkcell`, `akbank`, `trendyol`, `migros`, `getir` |
| Keyboard walks | `qweasd`, `asdfgh`, `qazwsx`, `1qaz2wsx` |
| Common passwords | `şifre`, `parola`, `admin`, `qwerty`, `123456` |

Inputs are matched on **both** `toLowerCase()` and `toLocaleLowerCase('tr-TR')` so users typing `İSTANBUL34` (Turkish keyboard) and `IBRAHIM` (English keyboard) are both flagged.

---

## Installation

```bash
yarn add react-native-password-intelligence
# or
npm install react-native-password-intelligence
```

Peer requirements:

- React `>=18.0.0`
- React Native `>=0.74.0`
- Node (for development) `>=18`

`@zxcvbn-ts/core` and `@zxcvbn-ts/language-common` are pulled in automatically. No native code or Expo plugin is required.

---

## Quick Start

### 1. Animated UI component

```tsx
import { PasswordMeter } from 'react-native-password-intelligence';

<PasswordMeter password={password} />;
```

### 2. Headless hook

```tsx
import { usePasswordRisk } from 'react-native-password-intelligence';

const { score, crackTimeDisplay, feedback } = usePasswordRisk(password);
```

### 3. Pure analysis (non-React)

```ts
import { analyzePassword } from 'react-native-password-intelligence';

const result = analyzePassword('galatasaray1905');
console.log(result.score); // 0 | 1 | 2 | 3 | 4
```

---

## Contextual Intelligence

### Per-call user inputs

Pass user-specific values (name, email, username) so they are penalized when they appear in the password.

```tsx
// Hook
const { score } = usePasswordRisk(password, [
  user.firstName,
  user.lastName,
  user.email,
]);

// Pure function
analyzePassword('mehmetyilmaz1907', ['Mehmet', 'Yılmaz']);

// UI component
<PasswordMeter
  password={password}
  userInputs={[user.firstName, user.email]}
/>;
```

### Global custom dictionary

Inject brand names or company-wide forbidden words once at startup. The list is deduplicated and capped at 10,000 entries.

```ts
import {
  addCustomDictionary,
  clearCustomDictionary,
} from 'react-native-password-intelligence';

// App entry point
addCustomDictionary(['Acme', 'AcmeCorp', 'AcmePay']);

// Tests / multi-tenant SSR
clearCustomDictionary();
```

---

## API Reference

### `analyzePassword(password, userInputs?)`

Pure function. Initializes zxcvbn on first call, then synchronous on subsequent calls.

```ts
analyzePassword(
  password: string,
  userInputs?: readonly (string | number)[]
): ZxcvbnResult
```

| Field | Type | Notes |
|---|---|---|
| `password` | `string` | Non-string values are coerced to `''`. Inputs longer than 1,024 characters are truncated. |
| `userInputs` | `readonly (string \| number)[]` | Optional. Merged with the global custom dictionary on every call. |

Returns the full [`ZxcvbnResult`](https://github.com/zxcvbn-ts/zxcvbn) with `score`, `feedback`, `crackTimesDisplay`, `crackTimesSeconds`, `guesses`, `sequence`, etc.

### `usePasswordRisk(password, userInputs?)`

React hook. Memoized by value (not reference), so consumers can pass inline arrays without infinite re-renders.

```ts
usePasswordRisk(
  password: string,
  userInputs?: readonly (string | number)[]
): {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: { warning: string | null; suggestions: string[] };
  crackTimeDisplay: string;
  raw: ZxcvbnResult;
}
```

### `<PasswordMeter />`

Animated 4-step progress bar. Two prop variants — provide either `password` (auto-analyzed) **or** `score` (pre-computed). Supplying neither is a TypeScript error. The pre-computed-score variant intentionally bypasses the analyzer entirely so consumers who already have a score (e.g., from a server) pay no zxcvbn initialization cost.

```ts
type PasswordMeterProps =
  | { password: string; userInputs?: readonly (string | number)[]; score?: never }
  | { score: 0 | 1 | 2 | 3 | 4; password?: never; userInputs?: never };
// plus optional `style?: StyleProp<ViewStyle>` and `barHeight?: number` (default 6)
```

### `addCustomDictionary(words)`

Idempotent. Adds entries to a deduplicated global `Set`. Past 10,000 entries the addition is rejected and a `console.warn` is emitted.

```ts
addCustomDictionary(words: readonly string[]): void
```

### `clearCustomDictionary()`

Resets the global custom dictionary. Intended for test isolation and multi-tenant SSR.

```ts
clearCustomDictionary(): void
```

---

## Score scale

The scale follows **NIST SP 800-63B** entropy guidelines.

| Score | Label | Color | UX meaning |
|:---:|:---|:---|:---|
| 0 | Very Weak | Red `#ef4444` | Trivially guessable |
| 1 | Weak | Orange `#f97316` | Common pattern detected |
| 2 | Fair | Yellow `#eab308` | Basic protection |
| 3 | Good | Lime `#84cc16` | High entropy |
| 4 | Strong | Green `#22c55e` | Robust & pattern-free |

---

## What this is not

- **Not a password manager** — does not store, transmit, or sync passwords.
- **Not a hash function** — does not produce or verify hashes. Pair with `bcrypt`, `argon2`, or your auth provider for storage.
- **Not a generator** — does not produce passwords. Use a CSPRNG-backed generator for that.
- **Not a server-side validator** — runs in the React Native runtime (or any JS runtime). The score is a UX hint, not a server-side authorization gate.

---

## Comparison

| Feature | `react-native-password-intelligence` | `zxcvbn-ts` (vanilla) | `react-native-password-strength-meter` |
|---|:---:|:---:|:---:|
| NIST 800-63B-aligned scoring | ✅ | ✅ | ⚠️ ad-hoc |
| Turkish cultural intelligence layer | ✅ | ❌ | ❌ |
| Dual-locale case-fold (`İ`/`I`) | ✅ | ❌ | ❌ |
| React Native UI component | ✅ | ❌ | ✅ |
| Headless React hook | ✅ | ❌ | ❌ |
| Per-call user inputs | ✅ | ✅ | ❌ |
| Global custom dictionary API | ✅ | ⚠️ via setOptions | ❌ |
| Long-input DoS guard | ✅ | ❌ | ❌ |
| TypeScript strict + provenance publish | ✅ | ✅ | ❌ |

---

## Engineering details

- **Deferred initialization** — zxcvbn options (translations, dictionaries) register on the first `analyzePassword` call, not at import time. A screen that never analyzes a password pays no setup cost.
- **Tree-shakeable** — `sideEffects: false`, so consumers who only import `analyzePassword` do not bundle the UI component or React hook.
- **Long-input safety** — passwords longer than 1,024 characters are truncated before zxcvbn sees them, capping the O(n²) matcher's worst-case cost.
- **Dual-locale case-folding** — both `toLowerCase()` and `toLocaleLowerCase('tr-TR')` are evaluated; the more pessimistic score is returned. The two paths only diverge when the input contains uppercase `I`/`İ`, so the cost is paid rarely.
- **Turkish feedback by default** — warning and suggestion strings are returned in Turkish, matching the dictionary intelligence. To use English, install `@zxcvbn-ts/language-en` and call `zxcvbnOptions.setOptions({ translations: enTranslations })` after the first `analyzePassword` call.
- **Industry-grade tests** — 127+ tests gated at 85% lines / 80% functions / 75% branches. A 30-input score-regression snapshot guards against accidental drift in dictionary or scoring updates.
- **Strict TypeScript** — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `isolatedModules`, `useDefineForClassFields`.
- **Zero native code** — pure JavaScript, works on Expo, iOS, Android, and Web.
- **Single-locale today** — the architecture is one Turkish dictionary deeply, not a plugin system. A locale-plugin abstraction is on the v0.4.0 roadmap; until then, "locale extensions" mean dictionary contributions to Turkish or forking with a new dictionary.

### Performance notes

- First `analyzePassword` call: ~30–80 ms cold (zxcvbn options registration + dictionary build).
- Subsequent calls: ~1–10 ms typical, ~50 ms worst case for inputs that hit the dual-locale branch.
- Dictionary footprint: 11 categories, ~30 KB minified.
- The hook memoizes by the JSON-stringified value of `(password, userInputs)`, so re-renders with the same input cost a single `JSON.parse`.

---

## Migration & Changelog

Upgrade notes (including the 0.2.x → 0.3.0 score-shift audit and how to revert to English feedback) live in [CHANGELOG.md](./CHANGELOG.md). Architecture rationale is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Security

Disclosure process and supported versions: [SECURITY.md](./SECURITY.md).

## Contributing

Contributions for new dictionary entries, surname-list updates, or bug fixes are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). For repo-wide commit hygiene see [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md).

## License

MIT © [mobilteknolojileri](https://github.com/mobilteknolojileri)
