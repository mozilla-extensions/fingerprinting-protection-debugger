/* global ChromeUtils, ExtensionAPI, Services */

const { ExtensionPreferencesManager } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionPreferencesManager.sys.mjs"
);
const { getSettingsAPI } = ExtensionPreferencesManager;

const { RFPHelper } = ChromeUtils.importESModule(
  "resource://gre/modules/RFPHelper.sys.mjs"
);

const OVERRIDES_NAME = "fingerprintingProtection.overrides";
const OVERRIDES_PREF = "privacy.fingerprintingProtection.overrides";

registerExtensionPrefSetting(OVERRIDES_NAME, OVERRIDES_PREF, "String");

this.fppOverrides = class extends ExtensionAPI {
  getAPI(context) {
    const { [OVERRIDES_NAME]: overridePrefApi } = extensionGetSettingsAPI(
      context,
      [OVERRIDES_NAME]
    );

    return {
      fppOverrides: {
        async get() {
          const overrides = deserializeOverrides(await overridePrefApi.get());
          appendDefaults(overrides);
          return overrides;
        },
        async set(target, enabled) {
          const overrides = await this.get();
          if (Object.keys(overrides).length === 0) {
            appendDefaults(overrides);
          }
          overrides[target] = enabled;
          await overridePrefApi.set(serializeOverrides(overrides));
        },
        async setAll(enabled) {
          await overridePrefApi.set(
            serializeOverrides(
              Object.fromEntries(TARGETS.map((t) => [t, enabled]))
            )
          );
        },
        async resetToDefaults() {
          const overrides = {};
          appendDefaults(overrides);
          await overridePrefApi.set(serializeOverrides(overrides));
        },
        async invalidTargets() {
          return invalidTargets(await overridePrefApi.get());
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
  if (str.length === 0) {
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
