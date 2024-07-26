import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export default create<StateType>()(
  immer((set, get) => ({
    targets: {
      ready: false,
      enabled: false,
      global: {},
      granular: {},
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
      async set(target, enabled, isGranular) {
        await browser.fppOverrides.set(
          target,
          enabled,
          get().activeTab.domain,
          isGranular
        );

        set((state) => {
          if (isGranular) {
            state.targets.granular[target] = enabled;
          } else {
            if (enabled) {
              state.targets.global[target] = enabled;
            } else {
              delete state.targets.global[target];
            }
          }
        });
      },
      async setAll(enabled, isGranular) {
        await browser.fppOverrides.setAll(
          enabled,
          get().activeTab.domain,
          isGranular
        );
        const allTargets = Object.fromEntries(
          get().targets.available.map((target) => [target, enabled])
        );

        set((state) => {
          state.targets[isGranular ? "granular" : "global"] = allTargets;
        });
      },
      async resetToDefaults(isGranular) {
        await browser.fppOverrides.resetToDefaults(
          get().activeTab.domain,
          isGranular
        );
        const defaults = Object.fromEntries(
          [...get().targets.defaults].map((t) => [t, true])
        );

        set((state) => {
          state.targets[isGranular ? "granular" : "global"] = defaults;
        });
      },
      async remove(name, isGranular) {
        await browser.fppOverrides.remove(
          name,
          get().activeTab.domain,
          isGranular
        );

        set((state) => {
          delete state.targets[isGranular ? "granular" : "global"][name];
        });
      },
      async clear(isGranular) {
        await browser.fppOverrides.clear(get().activeTab.domain, isGranular);

        set((state) => {
          state.targets[isGranular ? "granular" : "global"] = {};
        });
      },
      clearInvalids() {
        set((state) => {
          state.targets.invalids = [];
        });
      },
    },
    activeTab: {
      domain: "",
      async set(domain) {
        const { global, granular } = await browser.fppOverrides.get(domain);

        set((state) => {
          state.targets.global = global;
          state.targets.granular = granular;
          state.activeTab.domain = domain;
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
      beginningTargets: {
        global: {},
        granular: {},
      },
      isTroubleshooting() {
        const range = get().troubleshooter.range;
        return range[0] !== 0 || range[1] !== 0;
      },
      async load() {
        const range = await Storage.get("troubleshooterRange", [0, 0]);
        const beginningTargets = await Storage.get(
          "troubleshooterBeginningTargets",
          { global: {}, granular: {} }
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
        const targets = {
          global: get().targets.global,
          granular: get().targets.granular,
        };
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
    global: Record<browser.fppOverrides.Target, boolean>;
    granular: Record<browser.fppOverrides.Target, boolean>;
    defaults: Set<browser.fppOverrides.Target>;
    available: browser.fppOverrides.Target[];
    invalids: string[];
    enable: () => Promise<void>;
    load: () => Promise<void>;
    set: (
      target: browser.fppOverrides.Target,
      enabled: boolean,
      isGranular: boolean
    ) => Promise<void>;
    setAll: (enabled: boolean, isGranular: boolean) => Promise<void>;
    resetToDefaults: (isGranular: boolean) => Promise<void>;
    remove: (name: string, isGranular: boolean) => Promise<void>;
    clear: (isGranular: boolean) => Promise<void>;
    clearInvalids: () => void;
  };
}

interface ActiveTabState {
  activeTab: {
    domain: string;
    set: (domain: string) => void;
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
  message: string;
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
    beginningTargets: {
      global: Record<browser.fppOverrides.Target, boolean>;
      granular: Record<browser.fppOverrides.Target, boolean>;
    };
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
