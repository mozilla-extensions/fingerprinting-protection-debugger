import useStore from "../store";

export default function SetAllButtons() {
  const isGranular = false;
  const targets = useStore((state) => state.targets);

  return (
    <div className="inline-flex w-full" role="group" aria-label="Set all targets buttons">
      <button
        className="p-1.5 w-full text-sm border rounded-s-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={() => targets.setAll(true, isGranular)}
      >
        Enable All
      </button>
      <button
        className="p-1.5 w-full text-sm border-t border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={() => targets.setAll(false, isGranular)}
      >
        Disable All
      </button>
      <button
        className="p-1.5 w-full text-sm border rounded-e-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={() => targets.resetToDefaults(isGranular)}
      >
        Restore to Defaults
      </button>
    </div>
  );
}
