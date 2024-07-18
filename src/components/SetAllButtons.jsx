import useStore from "../state";

export default function SetAllButtons() {
  const targets = useStore((state) => state.targets);

  return (
    <div className="inline-flex w-full" role="group">
      <button
        className="p-2 w-full text-sm bg-white border border-gray-200 rounded-s-lg"
        onClick={() => targets.setAll(true)}
      >
        Activate All
      </button>
      <button
        className="p-2 w-full text-sm bg-white border-t border-b border-gray-200"
        onClick={() => targets.setAll(false)}
      >
        Deactivate All
      </button>
      <button
        className="p-2 w-full text-sm bg-white border border-gray-200 rounded-e-lg"
        onClick={() => targets.resetToDefaults()}
      >
        Defaults
      </button>
    </div>
  );
}
