import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export default create(
  immer((set, get) => ({
    targets: {
      loaded: false,
      enabled: false,
      global: {},
      granular: {},
      defaults: [],
      available: [],
      invalid: [],
      load: async () => {
        const enabled = await browser.fppOverrides.enabled();
        const invalidTargets = await browser.fppOverrides.invalidTargets();
        if (invalidTargets.length !== 0) {
          set((state) => {
            state.targets.invalid = invalidTargets;
          });
        }

        const defaults = await browser.fppOverrides.defaults();
        const available = await browser.fppOverrides.targets();

        set((state) => {
          state.targets.loaded = true;
          state.targets.enabled = enabled;
          state.targets.defaults = defaults;
          state.targets.available = available;
        });
      },
      set: async (name, enabled, isGranular) => {
        const domain = isGranular ? get().activeTab.domain : "";
        await browser.fppOverrides.set(name, enabled, domain);
        set((state) => {
          if (isGranular) {
            state.targets.granular[name] = enabled;
          } else {
            if (enabled) {
              state.targets.global[name] = enabled;
            } else {
              delete state.targets.global[name];
            }
          }
        });
      },
      setAll: async (enabled, isGranular) => {
        const domain = isGranular ? get().activeTab.domain : "";
        await browser.fppOverrides.setAll(enabled, domain);
        const allTargets = Object.fromEntries(
          get().targets.available.map((t) => [t, enabled])
        );

        set((state) => {
          if (isGranular) {
            state.targets.granular = allTargets;
          } else {
            state.targets.global = allTargets;
          }
        });
      },
      resetToDefaults: async (isGranular) => {
        const domain = isGranular ? get().activeTab.domain : "";
        await browser.fppOverrides.resetToDefaults(domain);
        const defaultTargets = Object.fromEntries(
          get().targets.defaults.map((t) => [t, true])
        );

        set((state) => {
          if (isGranular) {
            state.targets.granular = defaultTargets;
          } else {
            state.targets.global = defaultTargets;
          }
        });
      },
      enable: async () => {
        await browser.fppOverrides.enable();

        set((state) => {
          state.targets.enabled = true;
        });
      },
      loadOverrides: async (domain) => {
        const { global, granular } = await browser.fppOverrides.get(domain);

        set((state) => {
          state.targets.global = global;
          state.targets.granular = granular;
        });
      },
      removeGranularTarget: async (name) => {
        await browser.fppOverrides.removeGranularTarget(
          name,
          get().activeTab.domain
        );

        set((state) => {
          delete state.targets.granular[name];
        });
      },
      clearGranularTargets: async () => {
        await browser.fppOverrides.clearGranularTargets(get().activeTab.domain);
        set((state) => {
          state.targets.granular = {};
        });
      },
      clearInvalidTargets: () =>
        set((state) => {
          state.targets.invalid = [];
        }),
    },
    search: {
      query: "",
      set: (query) =>
        set((state) => {
          state.search.query = query;
        }),
    },
    blockingMessage: {
      message: "",
      set: (message) =>
        set((state) => {
          state.blockingMessage.message = message;
        }),
    },
    troubleshooter: {
      loaded: false,
      range: [0, 0],
      beginningTargets: {},
      message: "",
      isTroubleshooting() {
        const range = get().troubleshooter.range;
        return range[0] !== 0 || range[1] !== 0;
      },
      load: async () => {
        const range = await storage.get("troubleshooterRange", [0, 0]);
        const beginningTargets = await storage.get(
          "troubleshooterBeginningTargets",
          {}
        );

        set((state) => {
          state.troubleshooter.loaded = true;
          state.troubleshooter.range = range;
          state.troubleshooter.beginningTargets = beginningTargets;
        });
      },
      setRange: async (start, end) => {
        await storage.set({ troubleshooterRange: [start, end] });

        set((state) => {
          state.troubleshooter.range = [start, end];
        });
      },
      saveBeginningTargets: async () => {
        const targets = {
          global: get().targets.global,
          granular: get().targets.granular,
        };
        await storage.set({ troubleshooterBeginningTargets: targets });

        set((state) => {
          state.troubleshooter.beginningTargets = targets;
        });
      },
      setMessage: (message) =>
        set((state) => {
          state.troubleshooter.message = message;
        }),
    },
    notifications: {
      notifications: [],
      add: (notification) => {
        if (
          get().notifications.notifications.find(
            (n) => n.id === notification.id
          )
        ) {
          return;
        }

        set((state) => {
          state.notifications.notifications.push(notification);
        });
      },
      remove: (id) =>
        set((state) => {
          state.notifications.notifications =
            state.notifications.notifications.filter((n) => n.id !== id);
        }),
    },
    activeTab: {
      domain: "",
      set: async (domain) => {
        const { global, granular } = await browser.fppOverrides.get(domain);

        set((state) => {
          state.targets.global = global;
          state.targets.granular = granular;
          state.activeTab.domain = domain;
        });
      },
    },
  }))
);

const storage = {
  // Just in case we want to use sync/session etc. in the future
  storage: browser.storage.local,
  async get(key, defaultValue = undefined) {
    const data = await this.storage.get(key);
    return data[key] ?? defaultValue;
  },
  async set(data) {
    await this.storage.set(data);
  },
};
