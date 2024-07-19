/* global ChromeUtils, ExtensionAPI, Services */

const { ExtensionPreferencesManager } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionPreferencesManager.sys.mjs"
);
const { getSettingsAPI } = ExtensionPreferencesManager;

const { RFPHelper } = ChromeUtils.importESModule(
  "resource://gre/modules/RFPHelper.sys.mjs"
);

const FPP_NAME = "fingerprintingProtection";
const FPP_PREF = "privacy.fingerprintingProtection";
const OVERRIDES_NAME = "fingerprintingProtection.overrides";
const OVERRIDES_PREF = "privacy.fingerprintingProtection.overrides";
const GRANULAR_OVERRIDES_NAME = "fingerprintingProtection.granularOverrides";
const GRANULAR_OVERRIDES_PREF =
  "privacy.fingerprintingProtection.granularOverrides";

registerExtensionPrefSetting(OVERRIDES_NAME, OVERRIDES_PREF, "String");
registerExtensionPrefSetting(FPP_NAME, FPP_PREF, "Bool");
registerExtensionPrefSetting(
  GRANULAR_OVERRIDES_NAME,
  GRANULAR_OVERRIDES_PREF,
  "String"
);

this.fppOverrides = class extends ExtensionAPI {
  getAPI(context) {
    const {
      [FPP_NAME]: fppApi,
      [OVERRIDES_NAME]: overridesApi,
      [GRANULAR_OVERRIDES_NAME]: granularOverridesApi,
    } = extensionGetSettingsAPI(context, [
      FPP_NAME,
      OVERRIDES_NAME,
      GRANULAR_OVERRIDES_NAME,
    ]);

    return {
      fppOverrides: {
        async enable() {
          await fppApi.set(true);
        },
        async enabled() {
          return fppApi.get();
        },
        async get() {
          const overrides = deserializeOverrides(await overridesApi.get());
          appendDefaults(overrides);
          return overrides;
        },
        async getGranularOverrides() {
          return deserializeGranularOverrides(await granularOverridesApi.get());
        },
        async set(target, enabled) {
          const overrides = await this.get();
          if (Object.keys(overrides).length === 0) {
            appendDefaults(overrides);
          }
          overrides[target] = enabled;
          await overridesApi.set(serializeOverrides(overrides));
        },
        async setGranularOverride(domain, target, enabled) {
          const entries = await this.getGranularOverrides();
          const entryIndex = entries.findIndex(
            (e) => e.firstPartyDomain === domain
          );
          if (entryIndex === -1) {
            entries.push({
              firstPartyDomain: domain,
              thirdPartyDomain: "*",
              overrides: {},
            });
          }
          const entry = entries[entryIndex];
          entry.overrides[target] = enabled;
          await granularOverridesApi.set(serializeGranularOverrides(entries));
        },
        async setAll(enabled) {
          await overridesApi.set(
            serializeOverrides(
              Object.fromEntries(TARGETS.map((t) => [t, enabled]))
            )
          );
        },
        async resetToDefaults() {
          const overrides = {};
          appendDefaults(overrides);
          await overridesApi.set(serializeOverrides(overrides));
        },
        async invalidTargets() {
          return invalidTargets(await overridesApi.get());
        },
        targets() {
          return TARGETS;
        },
        defaults() {
          return DEFAULT_TARGETS;
        },
      },
    };
  }
};

const DISABLED_TARGETS = ["IsAlwaysEnabledForPrecompute", "AllTargets"];
const TARGETS = Object.keys(RFPHelper.getTargets()).filter(
  (t) => !DISABLED_TARGETS.includes(t)
);
const DEFAULT_TARGETS = RFPHelper.getTargetDefaults();

function deserializeOverrides(str) {
  const targets = {};
  if (!str || str.length === 0) {
    return targets;
  }
  for (let targetS of str.split(",")) {
    targetS = targetS.trim();
    const [op, target] = [targetS.slice(0, 1), targetS.slice(1)];
    targets[target] = op === "+";
  }
  return targets;
}

function serializeOverrides(targets) {
  return Object.entries(targets)
    .filter(([target, enabled]) => {
      if (
        (enabled && DEFAULT_TARGETS.includes(target)) ||
        (!enabled && !DEFAULT_TARGETS.includes(target))
      ) {
        return false;
      }
      return true;
    })
    .map(([target, enabled]) => (enabled ? "+" : "-") + target)
    .join(",");
}

function deserializeGranularOverrides(str) {
  const result = [];
  if (str.length === 0) {
    return result;
  }
  try {
    const unsanitized = JSON.parse(str);
    for (const entry of unsanitized) {
      const overrides = deserializeOverrides(entry.overrides);
      appendDefaults(overrides);

      // Setting both to "*" makes the entry invalid
      // and it will be ignored by nsRFPService.
      // So, we can safely ignore checks here.
      // We also don't support third-party overrides, but
      // we still parse them to serialize them back correctly.
      result.push({
        firstPartyDomain: entry.firstPartyDomain ?? "*",
        thirdPartyDomain: entry.thirdPartyDomain ?? "*",
        overrides: overrides,
      });
    }
  } catch (e) {
    /* empty */
  }
  return result;
}

function serializeGranularOverrides(entries) {
  return JSON.stringify(
    entries.map((entry) => {
      const overrides = serializeOverrides(entry.overrides);
      return {
        firstPartyDomain: entry.firstPartyDomain,
        thirdPartyDomain: entry.thirdPartyDomain,
        overrides: overrides,
      };
    })
  );
}

function appendDefaults(overrides) {
  DEFAULT_TARGETS.forEach((t) => {
    if (!(t in overrides)) {
      overrides[t] = true;
    }
  });
}

function invalidTargets(str) {
  const invalid = [];
  if (str.length === 0) {
    return invalid;
  }
  for (let targetS of str.split(",")) {
    targetS = targetS.trim();
    const [op, target] = [targetS.slice(0, 1), targetS.slice(1)];
    if (!validateOverride(op, target)) {
      invalid.push(op + target);
    }
  }
  return invalid;
}

function validateOverride(op, target) {
  return ["-", "+"].includes(op) && TARGETS.includes(target);
}

function registerExtensionPrefSetting(name, pref, type) {
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
}

function extensionGetSettingsAPI(context, names) {
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
}
