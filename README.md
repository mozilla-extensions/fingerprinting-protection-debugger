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

### Websites with Granular Overrides
It is possible to add granular overrides on Firefox. However, the extension doesn't support them. So, using them may lead to unexpected behavior. For that reason, we show a warning when the user tries to use the extension on a website with granular overrides. Here's what you need to know about these cases:

#### What are granular overrides?
Granular overrides are a way to enable or disable specific RFP targets for specific websites. They can be set through the `privacy.fingerprintingProtection.granularOverrides` preference. Sometimes, users set them, and sometimes we set them to prevent breakages on websites. So, it is possible for you to have an empty `privacy.fingerprintingProtection.granularOverrides` preference, but still have some targets enabled for specific websites.

#### How to debug websites with granular overrides?
To debug websites with granular overrides, we recommend the following steps:
1. Open the `about:config` page in Firefox.
1. Search for `privacy.fingerprintingProtection.granularOverrides`.
1. Check if you have any overrides set for the website you are debugging. If you do, remove it temporarily, if not follow the next step.
1. Search for `privacy.fingerprintingProtection.remoteOverrides.enabled`, and disable it temporarily.
1. Restart Firefox.

Now, you can use the extension to debug the website without any granular overrides interfering with the RFP targets. **Do not forget** to re-enable the `privacy.fingerprintingProtection.remoteOverrides.enabled` preference after you are done debugging. This will ensure that you are getting the latest webcompatibility fixes about RFP targets.
