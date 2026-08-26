const { expo } = require('./app.json');

// GitHub Pages serves project sites from /<repo>/, so the static web export
// needs its asset URLs prefixed. This lives here rather than in app.json so
// that local development (`yarn example start`) is unaffected - the variable
// is only set by the Pages deploy workflow.
const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;

module.exports = {
  ...expo,
  ...(baseUrl ? { experiments: { ...expo.experiments, baseUrl } } : {}),
};
