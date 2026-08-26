<div align="center">

# Password Intelligence

**Turkish-first, culturally-aware password strength estimation. No framework required.**
*Wraps the zxcvbn-ts engine with a Turkish-specific threat layer, in ~34 kB gzip.*

[![npm version](https://img.shields.io/npm/v/password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/password-intelligence)
[![npm downloads](https://img.shields.io/npm/dm/password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/password-intelligence)
[![bundle size](https://img.shields.io/bundlephobia/minzip/password-intelligence?style=flat-square&label=min%2Bgzip)](https://bundlephobia.com/package/password-intelligence)
[![CI](https://img.shields.io/github/actions/workflow/status/mobilteknolojileri/react-native-password-intelligence/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/mobilteknolojileri/react-native-password-intelligence/actions)
[![OpenSSF Scorecard](https://img.shields.io/ossf-scorecard/github.com/mobilteknolojileri/react-native-password-intelligence?style=flat-square&label=OpenSSF)](https://scorecard.dev/viewer/?uri=github.com/mobilteknolojileri/react-native-password-intelligence)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

<img src="https://raw.githubusercontent.com/mobilteknolojileri/react-native-password-intelligence/main/.github/assets/demo.png" alt="Password Intelligence demo" width="380" />

### [▶ Try it live](https://mobilteknolojileri.github.io/react-native-password-intelligence/)

**English** · [Türkçe](https://github.com/mobilteknolojileri/react-native-password-intelligence/blob/main/README.tr.md)

</div>

Runs in Node, Next.js, plain React, Deno, browsers, and React Native. Zero react or
react-native dependency.

> Building a React Native app? Install
> [`react-native-password-intelligence`](https://www.npmjs.com/package/react-native-password-intelligence)
> instead — it wraps this package and adds an animated meter and a headless hook.

## The problem

Standard password meters treat `password123` as weak but miss regional patterns like
`mehmet1907`, `karakartal`, or `askim34`. These are among the most common passwords in Turkish
breach corpora, and a generic English wordlist scores them as strong.

## Install

```sh
npm install password-intelligence
```

## Use

```ts
import { analyzePassword } from 'password-intelligence';

analyzePassword('galatasaray1905').score;  // 0 | 1 | 2 | 3 | 4
analyzePassword('galatasaray').feedback.warning;
// "Futbol takımı adları ve taraftar terimleri kolay tahmin edilir."

// Penalize values specific to this user
analyzePassword('mehmetyilmaz1907', ['Mehmet', 'Yılmaz', 'mehmet@example.com']);
```

### Turkish intelligence layer

12 categories, ~1,260 generated entries from 877 curated source terms (each expanded into
normalized, compacted, and ASCII-folded variants): common names, surnames (382 from TÜİK/NVI),
football clubs and fan slang, city names and plate codes, cultural/historic terms, romantic
terms, religious/ideological terms, zodiac signs, brands, keyboard walks, and common passwords.

Plus a frequency-ordered top-4,000 English password list and all six keyboard adjacency graphs.

## Configuration

```ts
import { configure, addCustomDictionary } from 'password-intelligence';

// Company-wide forbidden words (deduped, capped at 10,000)
addCustomDictionary(['Acme', 'AcmeCorp', 'AcmePay']);

// Restore the full 49,233-entry English list (adds ~229 kB gzip)
const { dictionary, adjacencyGraphs } = await import('@zxcvbn-ts/language-common');
configure({ dictionaries: dictionary, graphs: adjacencyGraphs });
```

`configure()` is valid at any time, including after the first analysis — options are re-applied
lazily on the next call, so there is no initialization ordering to get wrong and
`analyzePassword` stays synchronous.

| Option | Purpose |
|---|---|
| `dictionaries` | Extra zxcvbn dictionaries, merged over the bundled ones key by key |
| `graphs` | Replaces the bundled keyboard adjacency graphs |
| `translations` | Replaces the bundled Turkish feedback strings; add a `dictionaryWarnings` map to translate the Turkish-category warnings too |
| `disableTurkishDictionaries` | Ship only the English list |
| `disableBundledPasswords` | Ship only the Turkish categories |
| `maxLength` | Characters analysed before truncation (default 1024) |
| `useLevenshteinDistance`, `levenshteinThreshold` | Passed through to zxcvbn |

`configure()` validates synchronously and throws a `TypeError` / `RangeError` on an invalid option
without touching the current configuration.

`resetConfiguration()` reverts everything set via `configure()`. It deliberately does **not**
clear the custom dictionary — that is `clearCustomDictionary()`'s job.

Custom dictionary words and per-call `userInputs` are matched in their Turkish, compact and
ASCII-folded forms, exactly like the bundled categories, so `addCustomDictionary(['İkbalcan'])`
catches `ikbalcan`, `IKBALCAN` and `İkbalcan` alike.

## API

```ts
analyzePassword(password: string, userInputs?: readonly (string | number)[]): ZxcvbnResult
addCustomDictionary(words: readonly string[]): void
clearCustomDictionary(): void
configure(config: PasswordIntelligenceConfig): void
resetConfiguration(): void
subscribeToConfiguration(listener: () => void): () => void
getConfigurationVersion(): number
```

`subscribeToConfiguration` / `getConfigurationVersion` notify consumers that cache results (the
React Native hook uses them) whenever `configure`, `resetConfiguration`, `addCustomDictionary` or
`clearCustomDictionary` changes the engine state.

Non-string passwords are coerced to `''`; input beyond `maxLength` is truncated before zxcvbn
sees it, capping the O(n²) matcher's worst case.

## Standards

NIST SP 800-63B [§3.1.1.2](https://pages.nist.gov/800-63-4/sp800-63b.html) requires verifiers to
compare passwords against *"a blocklist that contains known commonly used, expected, or
compromised passwords"* — including **dictionary words** and **context-specific words, such as
the name of the service, the username, and derivatives thereof** — and to *"offer guidance to the
subscriber."* This library helps you implement that: the Turkish corpus is the regional
blocklist, `userInputs` covers context-specific words, and the Turkish feedback is the guidance.

**It does not make you compliant.** Enforcement belongs to the verifier and must happen
server-side. The same section also states that *"other composition requirements for passwords
SHALL NOT be imposed"* — do not layer character-class rules on top of this score.

## What this is not

- **Not a password manager** — does not store, transmit, or sync passwords.
- **Not a hash function** — pair with **Argon2id** ([RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html)),
  scrypt, or PBKDF2 per the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html);
  bcrypt only for legacy systems.
- **Not a generator** — use a CSPRNG-backed generator.
- **Not a server-side validator** — the score is a UX hint, not an authorization gate.

## Data provenance

The bundled password list and keyboard graphs are generated from
[`@zxcvbn-ts/language-common`](https://github.com/zxcvbn-ts/zxcvbn) (MIT), itself derived from
[dropbox/zxcvbn](https://github.com/dropbox/zxcvbn) (MIT). See
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

MIT © mobilteknolojileri
