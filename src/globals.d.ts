export {};

declare global {
  namespace browser {
    namespace fppOverrides {
      type Target = string;
      function enable(): Promise<void>;
      function enabled(incognito: boolean): Promise<boolean>;
      function get(): Promise<Record<Target, boolean>>;
      function hasGranular(domain: string): Promise<boolean>;
      function set(target: Target, enabled: boolean): Promise<void>;
      function setAll(enabled: boolean): Promise<void>;
      function remove(name: string): Promise<void>;
      function clear(): Promise<void>;
      function resetToDefaults(): Promise<void>;
      function forgetWebsite(domain: string): Promise<void>;
      function invalids(): Promise<string[]>;
      function available(): Promise<string[]>;
      function defaults(): Promise<Set<Target>>;
    }
  }
}
