import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import React from "react";

export default create<StateType>()(
  immer((set, get) => ({
    targets: {
      ready: false,
      enabled: false,
      overrides: {},
      defaults: new Set(),
      available: [],
      invalids: [],
      async enable() {
        await browser.fppOverrides.enable();
        set((state) => {
          state.targets.enabled = true;
        });
      },
      async load() {
        const enabled = await browser.fppOverrides.enabled();
        const invalids = await browser.fppOverrides.invalids();
        const defaults = await browser.fppOverrides.defaults();
        const available = await browser.fppOverrides.available();

        set((state) => {
          state.targets.ready = true;
          state.targets.enabled = enabled;
          state.targets.invalids = invalids;
          state.targets.defaults = defaults;
          state.targets.available = available;
        });
      },
      async set(target, enabled) {
        await browser.fppOverrides.set(target, enabled);

        set((state) => {
          if (enabled) {
            state.targets.overrides[target] = enabled;
          } else {
            delete state.targets.overrides[target];
          }
        });
      },
      async setAll(enabled) {
        await browser.fppOverrides.setAll(enabled);
        const allTargets = Object.fromEntries(
          get().targets.available.map((target) => [target, enabled])
        );

        set((state) => {
          state.targets.overrides = allTargets;
        });
      },
      async resetToDefaults() {
        await browser.fppOverrides.resetToDefaults();
        const defaults = Object.fromEntries(
          [...get().targets.defaults].map((t) => [t, true])
        );

        set((state) => {
          state.targets.overrides = defaults;
        });
      },
      async remove(name) {
        await browser.fppOverrides.remove(name);

        set((state) => {
          delete state.targets.overrides[name];
        });
      },
      async clear() {
        await browser.fppOverrides.clear();

        set((state) => {
          state.targets.overrides = {};
        });
      },
      clearInvalids() {
        set((state) => {
          state.targets.invalids = [];
        });
      },
    },
    activeTab: {
      async set(url) {
        const overrides = await browser.fppOverrides.get();

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          get().notifications.add({
            id: "non-http",
            message: "This extension only works on HTTP and HTTPS sites.",
            action: () => get().notifications.remove("non-http"),
            actionLabel: "Dismiss",
          });
        }

        const hasGranularOverrides = await browser.fppOverrides.hasGranular(
          url.hostname
        );
        if (hasGranularOverrides) {
          const granularOverridesSupportPage =
            "https://github.com/mozilla-extensions/fingerprinting-protection-debugger/blob/main/README.md#websites-with-granular-overrides";
          get().notifications.add({
            id: "granular-overrides",
            message: React.createElement(
              "a",
              {
                key: "granular-overrides-link",
                href: granularOverridesSupportPage,
                target: "_blank",
                rel: "noopener noreferrer",
              },
              "Granular overrides are set for this domain. Please refer to the documentation for more information."
            ),
            action: () => get().notifications.remove("granular-overrides"),
            actionLabel: "Dismiss",
          });
        }

        set((state) => {
          state.targets.overrides = overrides;
        });
      },
    },
    blockingMessage: {
      message: "",
      set(message) {
        set((state) => {
          state.blockingMessage.message = message;
        });
      },
    },
    notifications: {
      list: [],
      add(notification) {
        set((state) => {
          state.notifications.list.push(notification);
        });
      },
      remove(id) {
        set((state) => {
          state.notifications.list = state.notifications.list.filter(
            (n) => n.id !== id
          );
        });
      },
    },
    troubleshooter: {
      ready: false,
      message: "",
      range: [0, 0],
      beginningTargets: {},
      isTroubleshooting() {
        const range = get().troubleshooter.range;
        return range[0] !== 0 || range[1] !== 0;
      },
      async load() {
        const range = await Storage.get("troubleshooterRange", [0, 0]);
        const beginningTargets = await Storage.get(
          "troubleshooterBeginningTargets",
          {}
        );

        set((state) => {
          state.troubleshooter.ready = true;
          state.troubleshooter.range = range;
          state.troubleshooter.beginningTargets = beginningTargets;
        });
      },
      async setRange(start, end) {
        await Storage.set({ troubleshooterRange: [start, end] });

        set((state) => {
          state.troubleshooter.range = [start, end];
        });
      },
      async saveBeginningTargets() {
        const targets = get().targets.overrides;
        await Storage.set({ troubleshooterBeginningTargets: targets });

        set((state) => {
          state.troubleshooter.beginningTargets = targets;
        });
      },
      setMessage(message) {
        set((state) => {
          state.troubleshooter.message = message;
        });
      },
    },
  }))
);

interface TargetState {
  targets: {
    ready: boolean;
    enabled: boolean;
    overrides: Record<browser.fppOverrides.Target, boolean>;
    defaults: Set<browser.fppOverrides.Target>;
    available: browser.fppOverrides.Target[];
    invalids: string[];
    enable: () => Promise<void>;
    load: () => Promise<void>;
    set: (
      target: browser.fppOverrides.Target,
      enabled: boolean
    ) => Promise<void>;
    setAll: (enabled: boolean) => Promise<void>;
    resetToDefaults: () => Promise<void>;
    remove: (name: string) => Promise<void>;
    clear: () => Promise<void>;
    clearInvalids: () => void;
  };
}

interface ActiveTabState {
  activeTab: {
    set: (url: URL) => void;
  };
}

interface BlockingMessageState {
  blockingMessage: {
    message: string;
    set: (message: string) => void;
  };
}

export type Notification = {
  id: string;
  message: string | React.ReactElement;
  action: () => void;
  actionLabel: string;
};

interface NotificationsState {
  notifications: {
    list: Notification[];
    add: (notification: Notification) => void;
    remove: (id: Notification["id"]) => void;
  };
}

interface TroubleshooterState {
  troubleshooter: {
    ready: boolean;
    message: string;
    range: [number, number];
    beginningTargets: Record<browser.fppOverrides.Target, boolean>;
    isTroubleshooting(): boolean;
    load(): Promise<void>;
    setRange: (start: number, end: number) => Promise<void>;
    saveBeginningTargets: () => Promise<void>;
    setMessage: (message: string) => void;
  };
}

type StateType = TargetState &
  ActiveTabState &
  BlockingMessageState &
  NotificationsState &
  TroubleshooterState;

const Storage = {
  // Just in case we want to use sync/session etc. in the future
  storage: browser.storage.local,
  async get(key: string, defaultValue: unknown = undefined) {
    const data = await this.storage.get(key);
    return data[key] ?? defaultValue;
  },
  async set(data: Record<string, unknown>) {
    await this.storage.set(data);
  },
};
