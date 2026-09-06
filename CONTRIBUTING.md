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

`yarn release` (release-it) is deliberately **not** used: its conventional-changelog plugin
prepends a generated section over the hand-written one, and a breaking commit anywhere in the range
makes it propose a major bump. Release by hand instead.

1. Bump and propagate:

   ```sh
   npm pkg set version=X.Y.Z
   node scripts/sync-versions.mjs        # packages/* and the wrapper's dependency range
   yarn install --mode=update-lockfile   # do not skip this
   ```

   Skipping the lockfile refresh leaves `yarn.lock` on the previous version and every CI job fails
   at install with `YN0028: The lockfile would have been modified by this install`.

2. Write the `CHANGELOG.md` section, including its `[X.Y.Z]:` link definition at the bottom of the
   file.

3. Commit, then tag — **annotated**, never lightweight:

   ```sh
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin main
   # wait for CI to go green on main, then:
   git push origin vX.Y.Z
   ```

   `git push --follow-tags` silently skips lightweight tags, so the release never fires and the only
   symptom is a version that never reaches the registry. Push the tag explicitly.

4. The tag triggers `.github/workflows/release.yml`, which refuses a non-tag ref, refuses a tag
   whose package versions disagree (`node scripts/sync-versions.mjs --check --tag vX.Y.Z`), then
   publishes `password-intelligence` first (the wrapper depends on it) and the wrapper second, both
   with npm provenance via OIDC trusted publishing. Each publish step skips a version already on the
   registry, so re-running the workflow from the same tag finishes a partial release.

**Readmes only reach the registry on publish**, and the file that gets rendered is
`packages/core/README.md` or `packages/react-native/README.md` — never the repository root readme.
A documentation fix therefore needs a patch release, and any section rewritten at the root has to be
carried across to both package readmes in the same change.

**First publish of a new package name**: a trusted publisher can only be configured on a package
that already exists, so the name has to be claimed first. Publish a placeholder version manually —
both manifests set `publishConfig.provenance`, which cannot be produced outside CI, so override it
with `npm publish --access public --ignore-scripts --provenance=false`. Deprecate the placeholder,
then add the trusted publisher from the package settings on the registry website rather than the
CLI: the web form has an allowed-actions field the CLI cannot express, and direct publishing must be
permitted, not only staged publishing.

## Commit Conventions

We strictly enforce [Conventional Commits](./COMMIT_CONVENTION.md). Pull requests with non-compliant histories will require rebasing.

## Pull Request Process

- Focus each PR on a single logical change.
- Verify all linting and tests pass.
- For API changes, discuss via an issue first.

Thank you for contributing to safer authentication.
