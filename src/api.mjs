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

    const updateOverridesByScope = async (overrides, domain) => {
      if (domain) {
        const entries = deserializeGranularOverrides(
          await granularOverridesApi.get()
        );
        const entryI = entries.findIndex((e) => e.firstPartyDomain === domain);
        if (entryI === -1) {
          entries.push({
            firstPartyDomain: domain,
            thirdPartyDomain: "*",
            overrides: {},
          });
        }
        const entry = entries[entryI === -1 ? entries.length - 1 : entryI];
        entry.overrides = overrides;
        const isEmpty = false;
        if (isEmpty) {
          entries.splice(entryI, 1);
        }
        await granularOverridesApi.set(serializeGranularOverrides(entries));
      } else {
        await overridesApi.set(serializeOverrides(overrides));
      }
    };

    const getGranularOverrides = async (domain) => {
      const entries = deserializeGranularOverrides(
        await granularOverridesApi.get()
      );
      const entry = entries.find((e) => e.firstPartyDomain === domain);
      if (entry) {
        return entry.overrides;
      }
      const overrides = {};
      return overrides;
    };

    const getOverrides = async () => {
      const overrides = deserializeOverrides(await overridesApi.get());
      appendDefaults(overrides);
      return overrides;
    };

    return {
      fppOverrides: {
        async enable() {
          await fppApi.set(true);
        },
        async enabled() {
          return fppApi.get();
        },
        async get(domain) {
          const global = await getOverrides();
          const granular = await getGranularOverrides(domain);

          Object.keys(global)
            .filter((r) => !TARGETS.has(r))
            .forEach((r) => delete global[r]);

          Object.keys(granular)
            .filter((r) => !TARGETS.has(r))
            .forEach((r) => delete granular[r]);

          return { global, granular };
        },
        async set(target, enabled, domain) {
          const { global, granular } = await this.get(domain);
          const overrides = domain ? granular : global;
          overrides[target] = enabled;
          await updateOverridesByScope(overrides, domain);
        },
        async setAll(enabled, domain) {
          const overrides = Object.fromEntries(
            [...TARGETS].map((t) => [t, enabled])
          );
          await updateOverridesByScope(overrides, domain);
        },
        async removeGranularTarget(name, domain) {
          const { granular } = await this.get(domain);
          delete granular[name];
          await updateOverridesByScope(granular, domain);
        },
        async clearGranularTargets(domain) {
          await updateOverridesByScope({}, domain);
        },
        async resetToDefaults(domain) {
          const overrides = {};
          appendDefaults(overrides);
          await updateOverridesByScope(overrides, domain);
        },
        async invalidTargets() {
          return invalidTargets(await overridesApi.get());
        },
        targets() {
          return [...TARGETS];
        },
        defaults() {
          return DEFAULT_TARGETS;
        },
      },
    };
  }
};

const DISABLED_TARGETS = ["IsAlwaysEnabledForPrecompute", "AllTargets"];
const TARGETS = new Set(
  Object.keys(RFPHelper.getTargets()).filter(
    (t) => !DISABLED_TARGETS.includes(t)
  )
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

function filterNegatives(overrides) {
  return Object.fromEntries(
    Object.entries(overrides).filter(
      ([t, enabled]) => DEFAULT_TARGETS.includes(t) || enabled
    )
  );
}

function serializeOverrides(targets, skipNegatives = false) {
  targets = skipNegatives ? targets : filterNegatives(targets, skipNegatives);

  return Object.entries(targets)
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
      const overrides = serializeOverrides(entry.overrides, true);
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
  return ["-", "+"].includes(op) && TARGETS.has(target);
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
