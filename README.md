# Fingerprinting Protection Debugger

This is a Firefox extension to easily manage privacy.fingerprintingProtection.overrides using checkboxes and troubleshoot websites. You can search, enable and disable specific targets or all of them at once. You can use the troubleshooting mode to quickly find out which RFP target is causing the breakage. The extension is written with React. The experimental API is defined in [src/api.mjs](src/api.mjs).

### Test it locally

To test the extension locally, you need at least Firefox 128.0a1 version. Checkout package.json for defined scripts. Ideally, you would run `npm run watch-popup` and `npm run watch-ext` during development/testing.

### Troubleshooting mode

The goal of the troubleshooting mode is to find the breakage causing RFP target. The extension first enables one half of the protections, then depending on the user's response, it either enables the other half (e.g. the user reported that the website is now working) or cuts the enabled protections by half (e.g. the user reported that the website is still not working). Basically a binary search for the breakage causing RFP target.

### Disabled targets

Currently, two targets are disabled:

- IsAlwaysEnabledForPrecompute: This target is used internally. [According to its definition](https://searchfox.org/mozilla-central/rev/fa86401b80f19afb6ed9bfca127ecc5e3a6f0cdc/toolkit/components/resistfingerprinting/RFPTargets.inc#101-110), including it in overrides may result in undefined behavior.
- AllTargets: Including AllTargets breaks the UI logic. An active target is shown with a checked checkbox, but if we include AllTargets, active targets shown would be incorrect. Instead we have an `Active All` and `Deactivate all` button to quickly enable/disable all the targets.

### Targets with yellow background

The yellow background indicate that target is enabled by default. Without `-<DefaultTargetName>` in overrides, they are enabled by default.
