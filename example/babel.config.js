const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');

// getConfig() reads the `react-native-builder-bob` field from the package it is
// pointed at, so the private monorepo root cannot be used. Chain one call per
// published package instead — each appends its own `include` override.
const packages = ['core', 'react-native'].map((name) =>
  path.resolve(__dirname, '..', 'packages', name)
);

module.exports = function (api) {
  api.cache(true);

  return packages.reduce(
    (config, root) => getConfig(config, { root, pkg: require(`${root}/package.json`) }),
    { presets: ['babel-preset-expo'] }
  );
};
