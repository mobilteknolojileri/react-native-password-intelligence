# Commit Conventions

This project strictly follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

> [!IMPORTANT]  
> To maintain backwards traceability of the project history, commits must be **atomic** (one discrete change per commit) and **clear**. Use plain English to explicitly describe the action performed. Do not use emojis in commit messages to keep the git log clean and professional.

## Format

```text
<type>(<scope>): <description>
```

## Types

| Type       | Use for                                      |
| ---------- | -------------------------------------------- |
| `feat`     | New feature (e.g., new hook or UI component) |
| `fix`      | Bug fix                                      |
| `docs`     | Documentation changes                        |
| `style`    | Formatting (no logic change)                 |
| `refactor` | Code restructure without changing behavior   |
| `perf`     | Performance optimizations                    |
| `test`     | Adding or fixing tests                       |
| `build`    | Build system or package module changes       |
| `ci`       | CI/CD pipeline changes                       |
| `chore`    | Maintenance, tooling, and static assets      |
| `revert`   | Reverting a previous commit                  |

## Scopes

Use the following scopes to indicate the area of the codebase being modified:

- `core`: Core engine and Zxcvbn wrappers
- `dict`: Turkish dictionary and dataset files
- `ui`: Presentation components and styles
- `hooks`: React hooks
- `example`: The Expo demo application
- `deps`: Dependency updates
- `docs`: README, contributing guides, API documentation
- `ci`: GitHub Actions and workflows
- `release`: Publishing and versioning

## Examples

```text
feat(dict): add common turkish football club patterns
fix(ui): resolve overflow issue on strength meter
refactor(core): optimize dictionary loading strategy
docs(readme): add installation instructions
chore(deps): bump zxcvbn-ts to latest
ci: add basic unit test workflow
style(hooks): format usePasswordRisk with prettier
```

## Rules

- **Atomic**: One logical change per commit.
- **Imperative**: Use "add" not "added" or "adds".
- **Lowercase**: Description must start with a lowercase letter.
- **No code identifiers**: Avoid function/class/constant names in subject:
  - ❌ `add calculateCrackTime helper` → camelCase identifier
  - ❌ `fix PasswordMeter UI` → PascalCase identifier
  - ✅ `add crack time calculation helper` → descriptive lowercase
  - ✅ `fix spacing in password meter` → descriptive lowercase
- **No period**: Do not end the description with a `.`
- **Header length**: Keep the first line under 72 characters.

## Breaking Changes

For major changes that break backwards compatibility, append `!` after the scope:

```text
feat(core)!: change usePasswordRisk return signature
```

## Issue Reference

If the commit resolves an open issue, reference it at the end of the message:

```text
fix(dict): remove duplicate entries in tr dataset (#12)
```
