# Contributing to Password Intelligence

Contributions to `react-native-password-intelligence` are welcome. We aim to maintain a high standard of code quality and security intelligence.

## Philosophy: Localized Threat Intelligence

Our primary goal is accurate password strength estimation through cultural context. We focus on Turkish password habits (names, cities, sports, keyboard patterns), assembled as a regional blocklist corpus in the sense of NIST SP 800-63B §3.1.1.2.

### 1. Dictionary Contributions (`packages/core/src/dictionaries/tr.ts`)
We categorize patterns (e.g., `names`, `teams`, `slang`). Write entries in their natural Turkish casing (`İstanbul`, `Şanlıurfa`); `buildDictionary` derives the lowercase, compact and ASCII-folded variants. Entries must play a statistically significant role in known credential stuffing attacks.

### 2. Code Contributions
- **Headless Core**: Logic must remain decoupled from presentation.
- **Minimal Dependencies**: Maintain a small bundle footprint.
- **Strict Typing**: All new features must include TypeScript definitions.

## Development Workflow

This project uses [Yarn workspaces](https://yarnpkg.com/features/workspaces).

1. **Setup**:
   ```bash
   yarn install
   ```
2. **Execution**:
   The `example/` app demonstrates library usage. To test changes:
   ```bash
   yarn example start
   yarn example ios # or android / web
   ```
3. **Quality Control**:
   ```bash
   yarn typecheck
   yarn lint
   yarn test
   yarn build && node scripts/check-size.mjs && node scripts/check-pack.mjs
   ```

## Releasing

Both packages ship in lockstep on one version.

1. `yarn release` (release-it) bumps the root `package.json`, runs `scripts/sync-versions.mjs` to
   propagate the version to `packages/*` and to the wrapper's `password-intelligence` range,
   refreshes `yarn.lock`, commits, tags `vX.Y.Z` and pushes.
2. The tag triggers `.github/workflows/release.yml`, which re-verifies everything, refuses a tag
   whose package versions disagree (`node scripts/sync-versions.mjs --check --tag vX.Y.Z`), then
   publishes `password-intelligence` first (the wrapper depends on it) and the wrapper second, both
   with npm provenance via OIDC trusted publishing.
3. **First publish of a new package name**: npm trusted publishers can only be configured on a
   package that already exists on the registry. Publish the very first version of a new package
   manually with a granular access token (`npm publish --access public` from the built package
   directory), then add the GitHub Actions trusted publisher in the package settings before the
   next tag.

## Commit Conventions

We strictly enforce [Conventional Commits](./COMMIT_CONVENTION.md). Pull requests with non-compliant histories will require rebasing.

## Pull Request Process

- Focus each PR on a single logical change.
- Verify all linting and tests pass.
- For API changes, discuss via an issue first.

Thank you for contributing to safer authentication.
