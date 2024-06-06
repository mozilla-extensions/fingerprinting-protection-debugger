/* global ChromeUtils, ExtensionAPI */

const { Preferences } = ChromeUtils.importESModule(
  "resource://gre/modules/Preferences.sys.mjs"
);

const { RFPHelper } = ChromeUtils.importESModule(
  "resource://gre/modules/RFPHelper.sys.mjs"
);

const OVERRIDES_PREF = "privacy.fingerprintingProtection.overrides";

this.fppOverrides = class extends ExtensionAPI {
  getAPI() {
    return {
      fppOverrides: {
        get() {
          const overrides = deserializeOverrides(
            Preferences.get(OVERRIDES_PREF)
          );
          appendDefaults(overrides);
          return overrides;
        },
        set(target, enabled) {
          const overrides = this.get();
          if (Object.keys(overrides).length === 0) {
            appendDefaults(overrides);
          }
          overrides[target] = enabled;
          setSerialized(serializeOverrides(overrides));
        },
        setAll(enabled) {
          setSerialized(
            serializeOverrides(
              Object.fromEntries(TARGETS.map((t) => [t, enabled]))
            )
          );
        },
        resetToDefaults() {
          const overrides = {};
          appendDefaults(overrides);
          setSerialized(serializeOverrides(overrides));
        },
        invalidTargets() {
          return invalidTargets(Preferences.get(OVERRIDES_PREF));
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

function setSerialized(overrides) {
  Preferences.set(OVERRIDES_PREF, overrides);
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
