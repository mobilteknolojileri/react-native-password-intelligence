## Summary

<!-- One or two sentences on what this PR changes and why. -->

## Scope

<!-- Pick the most accurate scope per COMMIT_CONVENTION.md: -->
<!-- core | dict | ui | hooks | example | deps | docs | ci | release -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (existing API or behavior changes)
- [ ] Documentation only
- [ ] Dictionary expansion / threat-intelligence update
- [ ] Tooling / CI / build

## Checklist

- [ ] `yarn lint` passes
- [ ] `yarn typecheck` passes
- [ ] `yarn test` passes (and coverage thresholds still met)
- [ ] If user-facing: `CHANGELOG.md` updated under `[Unreleased]`
- [ ] If breaking: migration notes added to `CHANGELOG.md`
- [ ] If new public API: `README.md` API Reference updated
- [ ] Commit messages follow [Conventional Commits](../COMMIT_CONVENTION.md) (atomic, lowercase, no PascalCase identifiers in subject)

## Score-regression check (for `core:` or `dict:` changes)

If this PR changes the analyzer or any dictionary, has the score-regression snapshot in `src/__tests__/analyzer.test.ts` been reviewed? Any deliberate score shifts must be called out in the PR description and in the CHANGELOG migration section.

- [ ] Snapshot fixture reviewed
- [ ] Deliberate shifts documented (or N/A)

## Related issue

<!-- Closes #... -->
