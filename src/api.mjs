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

ExtensionPreferencesManager.addSetting(OVERRIDES_NAME, {
  prefNames: [OVERRIDES_PREF],

  setCallback(value) {
    return {
      [OVERRIDES_PREF]: value,
    };
  },

  getCallback() {
    return Services.prefs.getStringPref(OVERRIDES_PREF);
  },
});

this.fppOverrides = class extends ExtensionAPI {
  getAPI(context) {
    const overridePrefApi = getSettingsAPI({
      context,
      name: OVERRIDES_NAME,
    });

    const setSerialized = async (value) => overridePrefApi.set({ value });

    const getOverrides = async () =>
      overridePrefApi.get(OVERRIDES_NAME).then((r) => r.value);

    return {
      fppOverrides: {
        async get() {
          const overrides = deserializeOverrides(await getOverrides());
          appendDefaults(overrides);
          return overrides;
        },
        async set(target, enabled) {
          const overrides = await this.get();
          if (Object.keys(overrides).length === 0) {
            appendDefaults(overrides);
          }
          overrides[target] = enabled;
          await setSerialized(serializeOverrides(overrides));
        },
        async setAll(enabled) {
          await setSerialized(
            serializeOverrides(
              Object.fromEntries(TARGETS.map((t) => [t, enabled]))
            )
          );
        },
        async resetToDefaults() {
          const overrides = {};
          appendDefaults(overrides);
          await setSerialized(serializeOverrides(overrides));
        },
        async invalidTargets() {
          return invalidTargets(await getOverrides());
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
