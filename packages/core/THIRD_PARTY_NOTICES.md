# Third-Party Notices

This package vendors generated data derived from third-party sources. The
generator lives at `scripts/generate-data.mjs`; regenerate with
`yarn workspace password-intelligence run generate:data`.

## `src/data/enCommonLite.generated.ts` and `src/data/adjacencyGraphs.generated.ts`

Derived from **@zxcvbn-ts/language-common** (MIT), which is in turn derived from
**dropbox/zxcvbn** (MIT). The password frequency lists derive from public
breach-corpus analyses.

- https://github.com/zxcvbn-ts/zxcvbn
- https://github.com/dropbox/zxcvbn

Only the first 4,000 entries of the password list are vendored, in the original
frequency order. The full 49,233-entry list is available at runtime by
installing `@zxcvbn-ts/language-common` and passing it to `configure()`.

```
The MIT License (MIT)

Copyright (c) 2012 Dropbox, Inc.
Copyright (c) 2020 Daniel Boelzle and the zxcvbn-ts contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Runtime dependency

`@zxcvbn-ts/core` (MIT) is a normal runtime dependency and is not vendored.
