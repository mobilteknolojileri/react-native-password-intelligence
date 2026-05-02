# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :x: (please upgrade)            |
| < 0.2   | :x:                |

## Reporting a Vulnerability

If you believe you have found a security vulnerability in `react-native-password-intelligence`, please **do not open a public issue**. Instead, report it privately so we can investigate and ship a fix before details become public.

**Preferred:** open a [GitHub private security advisory](https://github.com/mobilteknolojileri/react-native-password-intelligence/security/advisories/new).

**Alternative:** email **mobilteknolojileri@gmail.com** with the subject line `SECURITY: react-native-password-intelligence`.

Please include:
- A clear description of the issue and the impact.
- Steps to reproduce, or a minimal proof-of-concept.
- The version (or commit SHA) you tested.
- Whether the issue is publicly known or being actively exploited.

## Disclosure Process

1. We acknowledge receipt within **3 business days**.
2. We aim to assess severity and confirm the vulnerability within **7 business days**.
3. We work toward a fix and coordinated disclosure within **90 days** of the initial report.
4. We will credit the reporter in the release notes unless anonymity is requested.

## Scope

In scope:
- The runtime code in `src/**/*.ts` and `src/**/*.tsx` shipped to npm under `react-native-password-intelligence`.
- Dictionary files in `src/dictionaries/` (e.g., entries that could enable injection or DoS).

Out of scope:
- Vulnerabilities in upstream dependencies (`@zxcvbn-ts/core`, etc.) — please report those upstream.
- Issues in the example app under `example/` (it is not shipped to npm).
- Social-engineering or phishing reports targeting individual maintainers.

## Hardening Notes for Consumers

- This library performs entropy-based estimation and pattern matching only. It does **not** transmit, persist, or hash the analyzed password.
- Inputs longer than 1,024 characters are truncated before being passed to the underlying matcher to prevent O(n²) cost on pathological inputs.
- `addCustomDictionary` is bounded at 10,000 entries to prevent unbounded growth in long-running processes.
- Treat `feedback.warning` / `feedback.suggestions` as advisory; rely on `score` for security-relevant gating logic.
