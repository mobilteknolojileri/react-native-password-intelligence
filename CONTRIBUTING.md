# Contributing to Password Intelligence

Contributions to `react-native-password-intelligence` are welcome. We aim to maintain a high standard of code quality and security intelligence.

## Philosophy: Localized Threat Intelligence

Our primary goal is accurate password strength estimation through cultural context. We focus on Turkish password habits (names, cities, sports, keyboard patterns) mapped against NIST 800-63B guidelines.

### 1. Dictionary Contributions (`src/dictionaries/tr.ts`)
We categorize patterns (e.g., `names`, `teams`, `slang`). Entries must be lowercase and possessing a statistically significant role in known credential stuffing attacks.

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
   ```

## Commit Conventions

We strictly enforce [Conventional Commits](./COMMIT_CONVENTION.md). Pull requests with non-compliant histories will require rebasing.

## Pull Request Process

- Focus each PR on a single logical change.
- Verify all linting and tests pass.
- For API changes, discuss via an issue first.

Thank you for contributing to safer authentication.
