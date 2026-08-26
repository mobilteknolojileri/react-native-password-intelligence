# Roadmap

This file records where the project is heading and, just as importantly, what it deliberately
will not do. Dates are intentionally absent — this is a small project and estimates would be
fiction. Items are ordered by priority within each release.

Have an opinion? Open a
[discussion](https://github.com/mobilteknolojileri/react-native-password-intelligence/discussions).

---

## 0.4.0 — current

Shipped in this release: the split into a framework-agnostic core, a 5x smaller default bundle,
and five correctness fixes. See [CHANGELOG.md](./CHANGELOG.md) for the detail and the migration
notes.

---

## 1.0.0 — API freeze

The goal of 1.0.0 is not new surface area; it is committing to the surface that exists.

### Locale plugin API

Today the architecture is one Turkish dictionary deeply, not a plugin system. `configure({
dictionaries })` already lets you inject any corpus at runtime, but there is no first-class way to
publish a locale as a package, and category-specific feedback strings are Turkish-only.

The intended shape is a locale object that bundles dictionaries, translations, and category
warnings together, so a `password-intelligence-locale-az` or `-de` can be installed and registered
in one call. Contributions that want to add a locale before this lands should open an issue first
— the current answer is a dictionary contribution to Turkish or a fork.

### Turkish-F keyboard adjacency graph

The bundled graphs cover QWERTY, QWERTZ, AZERTY, Dvorak and both keypads. The Turkish-F layout is
genuinely different and is used by a non-trivial number of Turkish typists, so walks on it are
currently invisible to the spatial matcher. This is hand-authored data, not something that can be
derived — a good first contribution.

### `debounceMs` on `usePasswordRisk`

`analyzePassword` measures ~8 ms per call on a desktop; on a mid-range Android that is plausibly
30–80 ms per keystroke. The hook memoizes but does not debounce, so a fast typist pays that cost
on every character. Either an opt-in `debounceMs` option or documented use of zxcvbn's own
`debounce` helper.

### `@zxcvbn-ts` v4 migration

v4 is an API rewrite rather than a version bump: `zxcvbn` and `zxcvbnOptions` are gone,
`crackTimesDisplay` is renamed, and dictionary keys changed (`passwords` → `passwords-common`).
Because this library re-exports `ZxcvbnResult`, the migration is breaking for consumers too and
therefore belongs to a major release.

---

## Under consideration

Not committed to. Feedback welcome.

- **HIBP k-anonymity helper** — an optional, clearly-separated async check against the Have I Been
  Pwned range API, for consumers who want breach lookup on top of local scoring.
- **Server-side preset** — a configuration bundle tuned for verifier-side enforcement (full
  dictionary, stricter defaults) rather than the client-side UX hint this ships as today.
- **Additional Turkish categories** — TV/dizi references, regional slang, employer names.

---

## Explicitly out of scope

These are not "not yet"; they are "no".

- **Password generation.** Needs a CSPRNG-backed generator and a policy engine. Use a dedicated
  library.
- **Hashing or storage.** Use Argon2id ([RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html))
  per the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- **Being a compliance product.** The library helps implement the NIST SP 800-63B §3.1.1.2
  blocklist requirement; it does not enforce anything and enforcement belongs on the server. See
  the Standards section of the [README](./README.md).
- **Shipping every locale superficially.** One locale done properly beats twelve done badly.
