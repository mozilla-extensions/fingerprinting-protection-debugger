import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export default create(
  immer((set, get) => ({
    targets: {
      loaded: false,
      enabled: false,
      overrides: {},
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
          return;
        }

        const defaults = await browser.fppOverrides.defaults();
        const overrides = await browser.fppOverrides.get();
        const available = await browser.fppOverrides.targets();

        set((state) => {
          state.targets.loaded = true;
          state.targets.enabled = enabled;
          state.targets.overrides = overrides;
          state.targets.defaults = defaults;
          state.targets.available = available;
        });
      },
      set: async (name, enabled) => {
        await browser.fppOverrides.set(name, enabled);

        set((state) => {
          state.targets.overrides[name] = enabled;
        });
      },
      setAll: async (enabled) => {
        await browser.fppOverrides.setAll(enabled);

        set((state) => {
          state.targets.overrides = Object.fromEntries(
            state.targets.available.map((t) => [t, enabled])
          );
        });
      },
      resetToDefaults: async () => {
        await browser.fppOverrides.resetToDefaults();

        set((state) => {
          state.targets.overrides = Object.fromEntries(
            state.targets.defaults.map((t) => [t, true])
          );
        });
      },
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
      beginningTargets: [],
      message: "",
      isTroubleshooting() {
        const range = get().troubleshooter.range;
        return range[0] !== 0 || range[1] !== 0;
      },
      load: async () => {
        const range = await storage.get("troubleshooterRange", [0, 0]);
        const beginningTargets = await storage.get(
          "troubleshooterBeginningTargets",
          []
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
        const targets = Object.entries(get().targets.overrides)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);
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
