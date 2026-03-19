<div align="center">

# Password Intelligence

**Turkish-first, locale-extensible password intelligence kit for React Native.**  
*Combines entropy-based estimation with regional threat intelligence.*

[![npm version](https://img.shields.io/npm/v/react-native-password-intelligence.svg?style=flat-square)](https://www.npmjs.com/package/react-native-password-intelligence)
[![CI](https://img.shields.io/github/actions/workflow/status/mobilteknolojileri/react-native-password-intelligence/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/mobilteknolojileri/react-native-password-intelligence/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square)](https://reactnative.dev/)

<!-- TODO: Replace with actual GIF or WebP -->
<!-- <img src="./assets/demo.gif" alt="React Native Password Intelligence Demo" width="300" /> -->

</div>

---

## The Mission: Regional Intelligence

Standard password meters treat `password123` as weak but often miss regional patterns like `mehmet1907`, `karakartal`, or `askim34`. These "cultural" passwords are among the most common found in regional data breaches.

**Password Intelligence** wraps the industry-standard [zxcvbn-ts](https://github.com/zxcvbn-ts/zxcvbn) engine, adding a **Turkish-first intelligence layer** with an extensible architecture for future locales.

### Turkish Intelligence Layer

| Category | Detections & Examples |
|---|---|
| Common Names | `mehmet`, `ayşe`, `fatma`, `burak`, `memo`, `nizipliibo`, etc. |
| Football Culture | Major clubs (`cimbom`, `fenerbahce`, `besiktas`) and fan terms. |
| City Plate Patterns | Intelligent matching for plate codes (e.g., `34`, `06`, `27`) and city names. |
| Cultural/Historic | Keywords like `ataturk`, `1453`, `1923`, `cumhuriyet`, `turkiye`. |
| Romantic & Social | Common terms like `askim`, `canim`, `hayatim`, `birtanem`. |
| Keyboard Walks | Robust detection for `qweasd`, `asdfgh`, `qazwsx`, etc. |

---

## Installation

```bash
yarn add react-native-password-intelligence
# or
npm install react-native-password-intelligence
```

*Note: This package automatically includes necessary zxcvbn-ts dependencies.*

---

## Quick Start

### 1. Animated UI Component
Includes a smooth, **zero-dependency** (vanilla Animated API) progress bar.

```tsx
import { PasswordMeter } from 'react-native-password-intelligence';

// In your render:
<PasswordMeter password={password} />
```

### 2. Headless Hook
Build your own custom UI with memoized analysis.

```tsx
import { usePasswordRisk } from 'react-native-password-intelligence';

const { score, crackTimeDisplay, feedback } = usePasswordRisk(password);
```

### 3. Pure Analysis (Non-React)
```typescript
import { analyzePassword } from 'react-native-password-intelligence';

const result = analyzePassword('galatasaray1905');
```

---

## Visuals & UX
The library provides an intuitive **4-step score scale** based on **NIST SP 800-63B** guidelines (entropy-based estimation).

| Score | Label | Color | UX Meaning |
|:---:|:---|:---|:---|
| 0 | Very Weak | Red | Trivially guessable |
| 1 | Weak | Orange | Common pattern detected |
| 2 | Fair | Yellow | Basic protection |
| 3 | Good | Lime | High entropy |
| 4 | Strong | Green | Robust & pattern-free |

---

## Engineering Excellence

- **Lazy Initialization**: Dictionaries load only on demand, keeping your initial bundle lean.
- **Extensive Coverage**: Robust testing for core logic, hooks, and UI components.
- **Zero Native Code**: Works out-of-the-box on Expo, iOS, Android, and Web.
- **Strictly Typed**: Built with modern TypeScript for the best developer experience.

---

## Contributing
Contributions for new locales or dictionary expansions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License
MIT © [mobilteknolojileri](https://github.com/mobilteknolojileri)
