<div align="center">

# 🔐 React Native Password Intelligence

**Turkish-aware password strength estimation for React Native**

[![npm version](https://img.shields.io/npm/v/react-native-password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/react-native-password-intelligence)
[![CI](https://img.shields.io/github/actions/workflow/status/mobilteknolojileri/react-native-password-intelligence/ci.yml?style=flat-square&label=CI)](https://github.com/mobilteknolojileri/react-native-password-intelligence/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square)](https://reactnative.dev/)

</div>

---

## Why This Library?

Standard password strength meters treat `mehmet1907`, `galatasaray1905`, or `askim123` as *reasonably strong* passwords. They are not — these are among the **most common Turkish credential patterns** found in data breaches.

**Password Intelligence** solves this by combining the entropy-based [zxcvbn-ts](https://github.com/zxcvbn-ts/zxcvbn-ts) engine with a curated **Turkish threat intelligence** layer:

| Pattern Category | Example Detections |
|---|---|
| 🧑 Common Names | `mehmet`, `ayşe`, `fatma`, `burak`, nicknames like `memo`, `ibo` |
| ⚽ Football Culture | `galatasaray`, `fenerbahce1907`, `cimbom`, `ultrAslan`, `karakartal` |
| 🚗 City Plate Codes | `34` (İstanbul), `06` (Ankara), `35` (İzmir), all 01–81 |
| ⌨️ Keyboard Walks | `qweasd`, `asdfgh`, `zxcvbn`, `qazwsx`, `123456` |
| 🇹🇷 Cultural Keywords | `ataturk`, `1453`, `1923`, `cumhuriyet`, `turkiye` |
| ❤️ Romantic Terms | `askim`, `canim`, `hayatim`, `sevgilim`, `birtanem` |
| 🕌 Religious Terms | `allah`, `bismillah`, `inshallah`, `elhamdulillah` |

> 💡 Based on **NIST SP 800-63B** guidelines: entropy and real-world crack-time estimation over legacy complexity rules.

---

## Installation

```bash
yarn add react-native-password-intelligence @zxcvbn-ts/core @zxcvbn-ts/language-common @zxcvbn-ts/language-en
```

```bash
# or with npm
npm install react-native-password-intelligence @zxcvbn-ts/core @zxcvbn-ts/language-common @zxcvbn-ts/language-en
```

> **Peer Dependencies**: `react` and `react-native` must already be in your project.

---

## Quick Start

### 1. Drop-in UI Component

```tsx
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { PasswordMeter } from 'react-native-password-intelligence';

export default function App() {
  const [password, setPassword] = useState('');

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        secureTextEntry
        onChangeText={setPassword}
        placeholder="Enter password"
      />
      <PasswordMeter password={password} />
    </View>
  );
}
```

### 2. Headless Hook (Build Your Own UI)

```tsx
import { usePasswordRisk } from 'react-native-password-intelligence';

function MyComponent() {
  const { score, crackTimeDisplay, feedback } = usePasswordRisk(password);

  return (
    <View>
      <Text>Score: {score}/4</Text>
      <Text>Crack time: {crackTimeDisplay}</Text>
      {feedback.warning && <Text>⚠️ {feedback.warning}</Text>}
    </View>
  );
}
```

### 3. Pure Function (Non-React)

```typescript
import { analyzePassword } from 'react-native-password-intelligence';

const result = analyzePassword('galatasaray1905');
console.log(result.score);      // 0-4
console.log(result.feedback);   // { warning, suggestions }
```

---

## API Reference

### `analyzePassword(password: string): ZxcvbnResult`

Core analysis function. Returns a full [zxcvbn-ts result](https://github.com/zxcvbn-ts/zxcvbn-ts#usage) including score, crack time estimates, feedback, and matched patterns.

### `usePasswordRisk(password: string): PasswordRiskResult`

React hook with memoized analysis. Returns:

| Property | Type | Description |
|---|---|---|
| `score` | `0 \| 1 \| 2 \| 3 \| 4` | Strength score |
| `feedback` | `{ warning: string; suggestions: string[] }` | Human-readable feedback |
| `crackTimeDisplay` | `string` | Estimated crack time (online, 10 guesses/s) |
| `raw` | `ZxcvbnResult` | Full result for advanced use |

### `<PasswordMeter />`

Animated progress bar component using vanilla React Native `Animated` API (no Reanimated dependency).

| Prop | Type | Required | Description |
|---|---|:---:|---|
| `password` | `string` | ✅* | Password to analyze (auto-computes score) |
| `score` | `0-4` | ✅* | Pre-computed score (skips analysis) |
| `barHeight` | `number` | — | Bar height in px (default: `6`) |
| `style` | `ViewStyle` | — | Custom container style |

> \* Provide either `password` or `score`, not both.

---

## Score Scale

| Score | Label | Color | Meaning |
|:---:|:---|:---|:---|
| 0 | Very Weak | 🔴 Red | Trivially guessable |
| 1 | Weak | 🟠 Orange | Common pattern detected |
| 2 | Fair | 🟡 Yellow | Protects from basic attacks |
| 3 | Good | 🟢 Lime | Decent entropy |
| 4 | Strong | 🟢 Green | High entropy, no patterns found |

---

## Engineering Standards

- **100% TypeScript** — Strict mode, explicit return types, discriminated unions
- **Lazy Initialization** — Dictionaries load on first use, preserving tree-shaking
- **Zero Native Code** — Pure JS/TS, works on iOS, Android, and Web
- **Atomic Commits** — [Conventional Commits](./COMMIT_CONVENTION.md) with commitlint enforcement
- **CI Pipeline** — Lint, typecheck, test, and build on every PR

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow, dictionary contribution guidelines, and PR process.

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<div align="center">
Made with ❤️ for Turkish cybersecurity by <a href="https://github.com/mobilteknolojileri">mobilteknolojileri</a>
</div>
