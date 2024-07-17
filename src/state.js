import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useStore = create(
  immer((set) => ({
    targets: {
      enabled: false,
      overrides: {},
      defaults: [],
      targets: [],
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
        const targets = await browser.fppOverrides.targets();
        set((state) => {
          state.targets.enabled = enabled;
          state.targets.overrides = overrides;
          state.targets.defaults = defaults;
          state.targets.targets = targets;
        });
      },
      setOverride: async (name, enabled) => {
        await browser.fppOverrides.set(name, enabled);
        set((state) => {
          state.targets.overrides[name] = enabled;
        });
      },
      setAll: async (enabled) => {
        await browser.fppOverrides.setAll(enabled);
        set((state) => {
          state.targets.overrides = Object.fromEntries(
            state.targets.targets.map((t) => [t, enabled])
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
    searchQuery: "",
    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query;
      }),
    blockingMessage: "",
    setBlockingMessage: (message) =>
      set((state) => {
        state.blockingMessage = message;
      }),
  }))
);
