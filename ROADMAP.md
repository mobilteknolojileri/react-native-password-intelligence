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
derived - a good first contribution.

`configure({ graphs })` merges layout by layout, so a contribution - or a consumer registering
the layout at runtime - can add Turkish-F on its own without disturbing the bundled six.

### `debounceMs` on `usePasswordRisk`

`analyzePassword` costs ~1 ms for an eight-character password, ~80 ms at 32 characters and ~230 ms
at 64, measured on a desktop - see the table under Performance notes in the README. A mid-range
Android is several times slower. The hook memoizes but does not debounce, so a fast typist pays
that cost on every character, and a password-manager paste into `<PasswordMeter />` visibly stalls
the JS thread today. This is the most urgent item on this list rather than a nicety. Either an
opt-in `debounceMs` option or documented use of zxcvbn's own `debounce` helper.

### `@zxcvbn-ts` v4 migration

v4 is an API rewrite rather than a version bump. The parts that touch this library:

- `zxcvbn`, `zxcvbnAsync` and `zxcvbnOptions` are **removed**, replaced by
  `new ZxcvbnFactory(options, customMatchers).check()`.
- `crackTimesSeconds` and `crackTimesDisplay` are merged into one `crackTimes` object whose keys
  lost their `1e10`/`1e4` infixes. `PasswordRiskResult.crackTimeDisplay` is derived from those, so
  this is breaking for consumers too.
- Dictionary keys are namespaced: `passwords` → `passwords-common`, `diceware` → `diceware-common`,
  `commonWords` → `commonWords-en`. `core/engine.ts` switches on the old names, so this breaks
  silently rather than loudly — it is the migration's real hazard.
- The `commonWords` source moved from FrequencyWords 2018 to OpenSubtitles 2024, which upstream
  notes "can result in a different scoring". The 30-input regression snapshot will move.
- Language packs gained `wordSequences` and a matcher for them, changing passphrase scoring.

Because of the re-exported result type, this belongs to a major release. Until it lands, the
dependency stays pinned to `^3.0.4`.

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
