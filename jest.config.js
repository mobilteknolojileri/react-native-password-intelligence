const bobPreset = require.resolve('react-native-builder-bob/babel-preset');

module.exports = {
  coverageReporters: ['text', 'lcov', 'json-summary'],
  // Both coverage settings are deliberately top-level:
  // - Jest 29 reads `collectCoverageFrom` from the global config only
  //   (jest-runner/runTest.js, @jest/reporters/CoverageReporter.js). Inside
  //   `projects[]` it is silently ignored, so untested files would never enter
  //   the coverage map and the generated data exclusion would not apply.
  //   The globs are still matched relative to EACH project's rootDir
  //   (`shouldInstrument` and `hasteFS.matchFilesWithGlob` both use the
  //   project config), hence `src/...` rather than `packages/*/src/...`.
  // - a per-project threshold would let the wrapper's high coverage mask a gap
  //   in the core package.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!src/data/*.generated.ts',
  ],
  coverageThreshold: {
    global: { lines: 85, functions: 80, branches: 75, statements: 85 },
  },
  projects: [
    {
      displayName: 'core',
      rootDir: '<rootDir>/packages/core',
      // No react-native preset: this is the proof that the core package
      // genuinely runs without React Native.
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': [
          'babel-jest',
          {
            configFile: false,
            babelrc: false,
            presets: [[bobPreset, { supportsStaticESM: false }]],
          },
        ],
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
      modulePathIgnorePatterns: ['<rootDir>/lib/'],
    },
    {
      displayName: 'react-native',
      rootDir: '<rootDir>/packages/react-native',
      preset: 'react-native',
      // The react-native preset uses a bare 'babel-jest', which resolves the
      // babel config relative to this project's rootDir. Since that is now
      // packages/react-native, the monorepo-root babel.config.js would not be
      // found and react-native's own Flow-typed jest/setup.js fails to parse.
      // An explicit absolute configFile bypasses root-based lookup entirely.
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': [
          'babel-jest',
          { configFile: require.resolve('./babel.config.js') },
        ],
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
      moduleNameMapper: {
        '^password-intelligence$': '<rootDir>/../core/src/index.ts',
      },
      modulePathIgnorePatterns: [
        '<rootDir>/lib/',
        '<rootDir>/../../example/node_modules',
      ],
    },
  ],
};
