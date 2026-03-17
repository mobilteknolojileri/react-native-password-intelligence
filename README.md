# React Native Password Intelligence

A professional-grade, **Turkish-aware** password intelligence and strength estimation kit for React Native.

Built on the [`@zxcvbn-ts/core`](https://github.com/zxcvbn-ts/zxcvbn) engine, this library implements highly accurate, NIST 800-63B compliant password risk assessments. It specifically targets localized threat patterns such as Turkish names, city-plakat codes, football teams, and regional keyboard walks (e.g., `qweasd`) without blocking the JavaScript main thread.

## Core Features

- **Turkish Threat Intelligence**: Pre-configured with curated Turkish dictionaries (detects common patterns like `fenerbahce1907`, `mehmet123`, `27antep`).
- **Headless Architecture**: Decoupled logic through the `usePasswordRisk` hook for custom UI implementations.
- **Efficient Performance**: Asynchronous analysis ensures zero lag during user input.
- **NIST 800-63B Compliant**: Focused on entropy and real-world crack-time estimation rather than arbitrary complexity rules.

## Installation

```bash
yarn add react-native-password-intelligence @zxcvbn-ts/core @zxcvbn-ts/language-common @zxcvbn-ts/language-en
```

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

### 2. Headless Hook

```tsx
import { usePasswordRisk } from 'react-native-password-intelligence';

// Inside your component
const { score, crackTimeDisplay, feedback } = usePasswordRisk(password);
```

## Engineering Standards

This library is maintained with strict adherence to:
- **100% TypeScript**: Fully typed interfaces.
- **Atomic Commits**: Following the [Conventional Commits](./COMMIT_CONVENTION.md) specification.
- **Minimal Footprint**: Peer-dependency model to keep your bundle light.

## License

MIT

---
Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
