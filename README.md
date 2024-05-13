# RFPTarget Overrider
This is a Firefox extension to easily manage privacy.fingerprintingProtection.overrides using checkboxes. You can search, enable and disable specific targets or all of them at once. The extension is written with React. The experimental API is defined in public/api.mjs.

### Test it locally
To test the extension locally, you have to be using the c6d8284bd68b commit, or if it has landed, use the Nightly version. Checkout package.json for defined scripts. Ideally, you would run watch-popup and watch-ext during development/testing.

### Disabled Targets
Currently, two targets are disabled:
- IsAlwaysEnabledForPrecompute: This target is used internally. According to its definition, inluding it in overrides may cause unexpected behaviour.
- AllTargets: Including AllTargets breaks the UI logic. An active target is shown with a checked checkbox, but if we include AllTargets, active targets shown would be incorrect. Instead we have an Active All and Deactivate all button.
