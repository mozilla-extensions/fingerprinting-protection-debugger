import { useStore } from "../state";

export default function SetAllButtons() {
  const [setAll, resetToDefaults] = useStore((state) => [
    state.targets.setAll,
    state.targets.resetToDefaults,
  ]);

  return (
    <div className="inline-flex w-full" role="group">
      <button
        className="px-2 py-2 w-full text-sm bg-white border border-gray-200 rounded-s-lg"
        onClick={() => setAll(true)}
      >
        Activate All
      </button>
      <button
        className="px-2 py-2 w-full text-sm bg-white border-t border-b border-gray-200"
        onClick={() => setAll(false)}
      >
        Deactive all
      </button>
      <button
        className="px-2 py-2 w-full text-sm bg-white border border-gray-200 rounded-e-lg"
        onClick={() => resetToDefaults()}
      >
        Defaults
      </button>
    </div>
  );
}
