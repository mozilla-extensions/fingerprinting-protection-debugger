/* global ChromeUtils, ExtensionAPI, Services */

const { ExtensionPreferencesManager } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionPreferencesManager.sys.mjs"
);
const { getSettingsAPI } = ExtensionPreferencesManager;

const { RFPHelper } = ChromeUtils.importESModule(
  "resource://gre/modules/RFPHelper.sys.mjs"
);

const DISABLED_TARGETS = new Set([
  "IsAlwaysEnabledForPrecompute",
  "AllTargets",
]);
const TARGETS = new Set(Object.keys(RFPHelper.getTargets())).difference(
  DISABLED_TARGETS
);
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
  // Serializes a map of targets to a string
  stringify(targets) {
    return Object.entries(targets)
      .map(([target, enabled]) => (enabled ? "+" : "-") + target)
      .join(",");
  },
  // Filters negative targets IFF they are not in the default set
  filterNegatives(targets) {
    return Object.fromEntries(
      Object.entries(targets).filter(
        ([t, enabled]) => DEFAULT_TARGETS.has(t) || enabled
      )
    );
  },
  // Parses a granular overrides string of the form '[{firstPartyDomain: "example.com", thirdPartyDomain: "*", overrides: "+target1,-target2"}]'
  parseGranular: function (str) {
    const entries = [];
    if (!str || str.length === 0) {
      return entries;
    }

    const json = Utils.tryParseJSON(str, []);
    for (const entry of json) {
      const overrides = OverridesHelper.parse(entry.overrides).targets;
      entries.push({
        firstPartyDomain: entry.firstPartyDomain ?? "*",
        thirdPartyDomain: entry.thirdPartyDomain ?? "*",
        overrides: overrides,
      });
    }

    return entries;
  },
  // Serializes a granular overrides array to a string
  stringifyGranular(entries) {
    return JSON.stringify(
      entries.map((entry) => {
        return {
          firstPartyDomain: entry.firstPartyDomain,
          thirdPartyDomain: entry.thirdPartyDomain,
          overrides: OverridesHelper.stringify(entry.overrides),
        };
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

const Utils = {
  // Tries to parse a JSON string, returns the default value if it fails
  tryParseJSON(str, defaultValue) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return defaultValue;
    }
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
const OVERRIDES_NAME = "fingerprintingProtection.overrides";
const OVERRIDES_PREF = "privacy.fingerprintingProtection.overrides";
const GRANULAR_OVERRIDES_NAME = "fingerprintingProtection.granularOverrides";
const GRANULAR_OVERRIDES_PREF =
  "privacy.fingerprintingProtection.granularOverrides";

ExtensionPrefHelper.addSetting(OVERRIDES_NAME, OVERRIDES_PREF, "String");
ExtensionPrefHelper.addSetting(FPP_NAME, FPP_PREF, "Bool");
ExtensionPrefHelper.addSetting(
  GRANULAR_OVERRIDES_NAME,
  GRANULAR_OVERRIDES_PREF,
  "String"
);

this.fppOverrides = class extends ExtensionAPI {
  getAPI(context) {
    // Create pref APIs for the FPP, overrides, and granular overrides prefs
    const extAPI = (() => {
      const apis = ExtensionPrefHelper.getAPIs(context, [
        FPP_NAME,
        OVERRIDES_NAME,
        GRANULAR_OVERRIDES_NAME,
      ]);

      return {
        fpp: apis[FPP_NAME],
        overrides: apis[OVERRIDES_NAME],
        granular: apis[GRANULAR_OVERRIDES_NAME],
      };
    })();

    const setTargetsByScope = async (overrides, domain, isGranular) => {
      if (isGranular) {
        const entries = await extAPI.granular
          .get()
          .then(OverridesHelper.parseGranular);
        const entryI = entries.findIndex((e) => e.firstPartyDomain === domain);
        if (entryI === -1) {
          entries.push({
            firstPartyDomain: domain,
            thirdPartyDomain: "*",
            overrides: {},
          });
        }

        // Remove the entry the overrides are empty
        const isEmpty = Object.keys(overrides).length === 0;
        if (isEmpty) {
          entries.splice(entryI === -1 ? entries.length - 1 : entryI, 1);
          await extAPI.granular.set(OverridesHelper.stringifyGranular(entries));
          return;
        }

        const entry = entries[entryI === -1 ? entries.length - 1 : entryI];
        entry.overrides = overrides;
        await extAPI.granular.set(OverridesHelper.stringifyGranular(entries));
      } else {
        await extAPI.overrides.set(
          OverridesHelper.stringify(OverridesHelper.filterNegatives(overrides))
        );
      }
    };

    return {
      fppOverrides: {
        // Enables privacy.fingerprintingProtection
        async enable() {
          await extAPI.fpp.set(true);
        },
        // Returns privacy.fingerprintingProtection
        async enabled() {
          return extAPI.fpp.get();
        },
        // Reads and parses privacy.fingerprintingProtection.overrides
        async get(domain) {
          const global = await extAPI.overrides
            .get()
            .then(OverridesHelper.parse)
            .then((r) => OverridesHelper.appendDefaults(r.targets));

          const granular = await (async () => {
            const entries = await extAPI.granular
              .get()
              .then(OverridesHelper.parseGranular);
            const entry = entries.find((e) => e.firstPartyDomain === domain);
            if (entry) {
              return entry.overrides;
            }
            return {};
          })();

          return {
            global,
            granular,
          };
        },
        // Modifies global or granular overrides to enable or disable a target
        async set(target, enabled, domain, isGranular) {
          const overrides = await this.get(domain);
          const targets = isGranular ? overrides.granular : overrides.global;
          targets[target] = enabled;

          await setTargetsByScope(targets, domain, isGranular);
        },
        // Modifies overrides to enable or disable all of the targets
        async setAll(enabled, domain, isGranular) {
          const overrides = Object.fromEntries(
            [...TARGETS].map((t) => [t, enabled])
          );

          await setTargetsByScope(overrides, domain, isGranular);
        },
        // Removes a target from the overrides. Unlike set, this function will not add -Target to overrides
        async remove(name, domain, isGranular) {
          const overrides = await this.get(domain);
          const targets = isGranular ? overrides.granular : overrides.global;
          delete targets[name];

          await setTargetsByScope(targets, domain, isGranular);
        },
        // Clears all the overrides
        async clear(domain, isGranular) {
          await setTargetsByScope({}, domain, isGranular);
        },
        // Modifies overrides to only enable defaults
        async resetToDefaults(domain, isGranular) {
          await setTargetsByScope(
            OverridesHelper.appendDefaults({}),
            domain,
            isGranular
          );
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
