export {};

declare global {
  namespace browser {
    namespace fppOverrides {
      type Target = string;
      function enable(): Promise<void>;
      function enabled(): Promise<boolean>;
      function get(domain: string): Promise<{
        global: Record<Target, boolean>;
        granular: Record<Target, boolean>;
      }>;
      function set(
        target: Target,
        enabled: boolean,
        domain: string,
        isGranular: boolean
      ): Promise<void>;
      function setAll(
        enabled: boolean,
        domain: string,
        isGranular: boolean
      ): Promise<void>;
      function remove(
        name: string,
        domain: string,
        isGranular: boolean
      ): Promise<void>;
      function clear(domain: string, isGranular: boolean): Promise<void>;
      function resetToDefaults(
        domain: string,
        isGranular: boolean
      ): Promise<void>;
      function invalids(): Promise<string[]>;
      function available(): Promise<string[]>;
      function defaults(): Promise<Set<Target>>;
    }
  }
}
