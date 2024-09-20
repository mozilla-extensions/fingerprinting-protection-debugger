# How to contribute?

Thank you for considering contributing!

If you choose to develop the extension, you should ideally be familiar with React, TypeScript, state management, Zustand in particular, Tailwind/CSS, and [RFP Targets](https://searchfox.org/mozilla-central/source/toolkit/components/resistfingerprinting/RFPTargets.inc). Depending on what you want to achieve you may only need a subset of these.

In addition, this extension uses the Experimental API ([Firefox's documentation](https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/basics.html#adding-experimental-apis-in-privileged-extensions) and [Thunderbird's documentation](https://webextension-api.thunderbird.net/en/stable/experiments/introduction.html)) to set Firefox preferences that are not exposed to extensions normally. It is defined in [src/api.mjs](src/api.mjs) and [src/schema.json](src/schema.json).

## Get started

To get started, simply clone the repo, and run `npm install` to install dependencies. [package.json](package.json) has a few NPM scripts that are defined. During development, you should run both `watch-popup` and `watch-ext`. The first script will build the React code automatically when you make a change, and the second script will automatically install the newly built extension to Firefox Nightly.

### React

Component Tree starting from [App/Root](src/App.tsx)
- [InitialStateLoader](src/components/InitialStateLoader.tsx)
- [BlockingMessage](src/components/BlockingMessage.tsx)
- [Notifications](src/components/Notifications.tsx)
- [Navigation](src/components/Navigation.tsx)
  - [Home](src/pages/Home.tsx)
    - [Troubleshooter](src/components/Troubleshooter.tsx)
    - [SetAllButtons](src/components/SetAllButtons.tsx)
    - [TargetList](src/components/TargetList.tsx)
      - [TargetCheckbox](src/components/TargetCheckbox.tsx)

Entry point of the application is [src/App.tsx](src/App.tsx). There you'll find the following:

- `<InitialStateLoader />`: Initial state loader component, as its name suggests, loads and initializes the state. This includes fetching RFP Targets from Firefox using [RFPHelper](https://searchfox.org/mozilla-central/source/toolkit/components/resistfingerprinting/RFPHelper.sys.mjs), loading the state of troubleshooter from [browser.storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage), loading the active tab's domain, checking for invalid RFP targets, and checking whether fingerprinting protection is enabled or not.
- `<BlockingMessage />`: This component shows up over every element to "block" the access to extension while the initial state is being loaded.
- `<Notifications />`: Similar to BlockingMessage component, Notifications component is used to show messages to the user, however, it is not blocking. The user can dismiss or interact with the notification.
- `<Navigation tabs={tabs} />`: This component manages the navigation. Currently, navigation bar is hidden as there's no second page, but we used to have, and decided to keep this component just in case we decide to add another page in the future.

In Home page, you'll find:

- `<Troubleshooter />`: Troubleshooter component is used to run a binary search like algorithm to find out which RFP target is causing the issue with the website the user is currently using. This is useful when a user reports a website that is broken due to RFP, and we need to find out which RFP target is causing the issue.
- `<SetAllButtons />`: This component is used to enable or disable RFP targets. We don't support `+/-AllTargets` due to how it would affect the UI. Instead, we have `SetAll` buttons that allow the user to enable or disable all RFP targets.
- `<TargetList />`: This component is used to list all RFP targets. It uses TargetCheckbox component to render each target.
  - `<Search />`: This component is used to search for RFP targets. It filters the targets based on the user's input.
  - `<TargetCheckbox />`: This component is used to render a single RFP target. It is shows a checkbox and a button. The checkbox shows whether the target is enabled or not, and the button is used to change the scope of the target. The button's text color will be red when the RFP target was previously set granularly but the scope is set to all, or vice versa. When it is red, the user won't be able to enable or disable the target until they switch the scope to correct one.

### State Management

This extension uses Zustand for state management. The state is defined in [src/store.ts](src/store.ts). Currently, there are 5 components in the state:

- `targets`: Targets store the available RFP targets, globally and granularly enabled targets, default targets, and invalid targets. Note that the following is not an exhaustive list of functions, but the most important ones.
  - `load` function fetches whether fingerprinting protection is enabled or not, invalid, default, and available RFP targets from Firefox. We don't load enabled targets here, as we don't have the current tab's domain yet.
  - `set` function is used to enable or disable an RFP target globally or granularly. Calling set with `enabled: false` will set the target as `-TargetName`. We use `-TargetNames` to disable default targets globally, or disable a target granularly for a specific domain.
  - `remove` function is used to remove an RFP target from the targets. Unlike set, remove will actually remove the target from the overrides and not just disable it. This is useful for removing non-default globally disabled targets.
  - `clear` function will clear all the overrides.
- `activeTab`: Active tab is used to store the current tab's domain. This is used to determine which RFP targets are enabled granularly for the current domain.
- `blockingMessage`: Blocking message is used to show a blocking message over the extension while the initial state is being loaded.
- `notifications`: Notifications is used to show messages to the user. It is an array of objects, where each object has a id, message, action, and actionLabel. You may call `remove` function with the id to remove the notification.
- `troubleshooter`: Troubleshooter is used to store the state of the troubleshooter. It stores the current range target, and beginning targets. Range is the 2x the current range of targets we are testing, and beginning targets is used to enable the targets that were enabled previously before starting the troubleshooter. We store the range and beginning targets in `browser.storage` to persist the state between pop-up reloads.

### Experimental API

This extension uses the Experimental API to set Firefox preferences that are not exposed to extensions normally. It is defined in [src/api.mjs](src/api.mjs) and [src/schema.json](src/schema.json). The API file contains the following:

- `OverridesHelper`: This is used to parse, stringify global and granular overrides.
- `Utils`: There's only one function defined at the moment, and it is `tryParseJSON`. It is used to parse JSON, and if it fails, it will return given default value.
- `ExtensionPrefHelper`: This is used to wrap around the `ExtensionPreferencesManager` API. It simplifies the process of setting and getting preferences.
- `this.fppOverrides`: This is the actual Experimental API that is exposed to the extension. For it's detailed documentation, please refer to [src/schema.json](src/schema.json). In short, it is responsible for setting and getting the overrides globally and granularly.
