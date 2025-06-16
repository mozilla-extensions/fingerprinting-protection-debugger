/* global ChromeUtils, ExtensionAPI, Services */

const { ExtensionPreferencesManager } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionPreferencesManager.sys.mjs"
);
const { getSettingsAPI } = ExtensionPreferencesManager;

const { RFPHelper } = ChromeUtils.importESModule(
  "resource://gre/modules/RFPHelper.sys.mjs"
);

const { ForgetAboutSite } = ChromeUtils.importESModule(
  "resource://gre/modules/ForgetAboutSite.sys.mjs"
);

const DISABLED_TARGETS = new Set([
  "IsAlwaysEnabledForPrecompute",
  "AllTargets",
]);
const TARGETS_ENUM = RFPHelper.getTargets();
const TARGETS = new Set(Object.keys(TARGETS_ENUM)).difference(DISABLED_TARGETS);
const DEFAULT_TARGETS = new Set(RFPHelper.getTargetDefaults());

const OverridesHelper = {
  // Parses a string of the form "+target1,-target2,+target3"
  parse(str) {
    const targets = {};
    const invalid = [];
    if (!str || str.length === 0) {
      return { targets, invalid };
    }
    for (const targetStr of str.split(",").map((s) => s.trim())) {
      const [op, target] = [targetStr.slice(0, 1), targetStr.slice(1)];
      if (!OverridesHelper.validateEntry(op, target)) {
        invalid.push(targetStr);
        continue;
      }
      targets[target] = op === "+";
    }
    return { targets, invalid };
  },
  // Validates an entry of the form "+target" or "-target"
  validateEntry(op, target) {
    return ["-", "+"].includes(op) && TARGETS.has(target);
  },
  // Validates a target and throws an error if it is invalid
  validateTarget(target) {
    if (!TARGETS.has(target)) {
      throw new Error("Invalid target");
    }
  },
  // Validate domain and returns a URI object if valid, or null if invalid
  validateDomain(domain) {
    if (!domain || domain.length === 0) {
      return null;
    }

    if (domain === "*") {
      return null;
    }

    const uri = Services.io.newURI("https://" + domain);
    if (!uri || uri.displayHost !== domain) {
      return null;
    }

    if (!uri.schemeIs("https")) {
      return null;
    }

    return uri;
  },
  // Serializes a map of targets to a string
  stringify(targets) {
    return Object.entries(targets)
      .map(([target, enabled]) => (enabled ? "+" : "-") + target)
      .join(",");
  },
  // Filters out targets that doesn't need to be included in the overrides string.
  minimizeOverrides(targets) {
    return Object.fromEntries(
      Object.entries(targets).filter(([t, enabled]) => {
        if (DEFAULT_TARGETS.has(t)) {
          return !enabled; // Only include if it's disabled.
        }

        return enabled;
      })
    );
  },
  // Adds default targets to an overrides object and returns it. Does not modify the input object.
  appendDefaults(overrides) {
    return Object.assign(
      Object.fromEntries([...DEFAULT_TARGETS].map((t) => [t, true])),
      { ...overrides }
    );
  },
};

const ExtensionPrefHelper = {
  // Adds a setting to the ExtensionPreferencesManager
  // This enables setting the prefs back to its previous values when the extension is uninstalled
  addSetting(name, pref, type) {
    ExtensionPreferencesManager.addSetting(name, {
      prefNames: [pref],

      setCallback(value) {
        return {
          [pref]: value,
        };
      },

      getCallback() {
        return Services.prefs[`get${type}Pref`](pref);
      },
    });
  },
  // Returns an object with get and set functions for each setting
  getAPIs(context, names) {
    return names.reduce((acc, name) => {
      const api = getSettingsAPI({
        context,
        name,
      });
      acc[name] = {
        set: (value) => api.set({ value }),
        get: () => api.get(name).then((r) => r.value),
      };
      return acc;
    }, {});
  },
};

const FPP_NAME = "fingerprintingProtection";
const FPP_PREF = "privacy.fingerprintingProtection";
const FPP_PBM_NAME = "fingerprintingProtection.pbmode";
const FPP_PBM_PREF = "privacy.fingerprintingProtection.pbmode";
const OVERRIDES_NAME = "fingerprintingProtection.overrides";
const OVERRIDES_PREF = "privacy.fingerprintingProtection.overrides";

ExtensionPrefHelper.addSetting(OVERRIDES_NAME, OVERRIDES_PREF, "String");
ExtensionPrefHelper.addSetting(FPP_NAME, FPP_PREF, "Bool");
ExtensionPrefHelper.addSetting(FPP_PBM_NAME, FPP_PBM_PREF, "Bool");

this.fppOverrides = class extends ExtensionAPI {
  getAPI(context) {
    // Create pref API for the FPP and override prefs.
    const extAPI = (() => {
      const apis = ExtensionPrefHelper.getAPIs(context, [
        FPP_NAME,
        FPP_PBM_NAME,
        OVERRIDES_NAME,
      ]);

      return {
        fpp: apis[FPP_NAME],
        fppPrivateBrowsing: apis[FPP_PBM_NAME],
        overrides: apis[OVERRIDES_NAME],
      };
    })();

    const setOverrides = async (overrides) => {
      await extAPI.overrides.set(
        OverridesHelper.stringify(OverridesHelper.minimizeOverrides(overrides))
      );
    };

    return {
      fppOverrides: {
        // Enables privacy.fingerprintingProtection
        async enable() {
          await extAPI.fpp.set(true);
        },
        // Returns privacy.fingerprintingProtection or privacy.fingerprintingProtection.pbmode if it is enabled and the incognito mode is enabled.
        async enabled(incognito) {
          if (incognito && extAPI.fppPrivateBrowsing.get()) {
            return true;
          }
          return extAPI.fpp.get();
        },
        // Reads and parses privacy.fingerprintingProtection.overrides
        get() {
          return extAPI.overrides
            .get()
            .then(OverridesHelper.parse)
            .then((r) => OverridesHelper.appendDefaults(r.targets));
        },
        // Calls Services.rfp.getFingerprintingOverrides and returns whether the domain has granular overrides or not.
        async hasGranular(domain) {
          const uri = OverridesHelper.validateDomain(domain);
          if (uri === null) {
            console.warn("Invalid domain provided to hasGranular, ignoring.");
            return false;
          }
          const baseDomain = Services.eTLD.getBaseDomain(uri);

          let overrides = null;
          try {
            overrides = Services.rfp.getFingerprintingOverrides(
              baseDomain + ",0"
            );
          } catch {
            // getFingerprintingOverrides throws if there are no overrides for the domain.
          }

          return overrides !== null;
        },
        // Modifies overrides to enable or disable a target
        async set(target, enabled) {
          OverridesHelper.validateTarget(target);

          const overrides = await this.get();
          overrides[target] = enabled;

          await setOverrides(overrides);
        },
        // Modifies overrides to enable or disable all of the targets
        async setAll(enabled) {
          const overrides = Object.fromEntries(
            [...TARGETS].map((t) => [t, enabled])
          );

          await setOverrides(overrides);
        },
        // Removes a target from the overrides. Unlike set, this function will not add -Target to overrides
        async remove(target) {
          OverridesHelper.validateTarget(target);

          const overrides = await this.get();
          delete overrides[target];

          await setOverrides(overrides);
        },
        // Clears all the overrides
        async clear() {
          await setOverrides({});
        },
        // Modifies overrides to only enable defaults
        async resetToDefaults() {
          await setOverrides(OverridesHelper.appendDefaults({}));
        },
        // Forgets the website
        async forgetWebsite(domain) {
          if (OverridesHelper.validateDomain(domain) === null) {
            console.warn("Invalid domain provided to forgetWebsite, ignoring.");
            return;
          }

          await ForgetAboutSite.removeDataFromBaseDomain(domain);
        },
        // Validates the global overrides and returns unknown targets
        invalids() {
          return extAPI.overrides
            .get()
            .then((s) => OverridesHelper.parse(s).invalid);
        },
        // Returns a list of available targets
        available() {
          return [...TARGETS];
        },
        // Returns a list of default targets
        defaults() {
          return DEFAULT_TARGETS;
        },
      },
    };
  }
};
