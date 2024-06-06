# Fingerprinting Protection Debugger

This is a Firefox extension to easily manage privacy.fingerprintingProtection.overrides using checkboxes. You can search, enable and disable specific targets or all of them at once. The extension is written with React. The experimental API is defined in [public/api.mjs](public/api.mjs).

### Test it locally

To test the extension locally, you have to be using a local build with [c6d8284bd68b](https://hg.mozilla.org/mozilla-central/rev/8fae218a34cd) commit, or use Nightly 128.0a1 version and the versions after that. Checkout package.json for defined scripts. Ideally, you would run `npm run watch-popup` and `npm run watch-ext` during development/testing.

### Disabled Targets

Currently, two targets are disabled:

- IsAlwaysEnabledForPrecompute: This target is used internally. [According to its definition](https://searchfox.org/mozilla-central/rev/fa86401b80f19afb6ed9bfca127ecc5e3a6f0cdc/toolkit/components/resistfingerprinting/RFPTargets.inc#101-110), inluding it in overrides may result in undefined behaviour.
- AllTargets: Including AllTargets breaks the UI logic. An active target is shown with a checked checkbox, but if we include AllTargets, active targets shown would be incorrect. Instead we have an `Active All` and `Deactivate all` butto to quickly enable/disable all the targets.

### Targets with yellow background

The yellow background indicate that target is enabled by default. Without `-<DefaultTargetName>` in overrides, they are enabled by default.
