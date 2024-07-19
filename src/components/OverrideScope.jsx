import useStore from "../state";

export default function OverrideScope() {
  const [overrideScope, setOverrideScope] = useStore((state) => [
    state.targets.overrideScope,
    state.targets.setOverrideScope,
  ]);

  return (
    <div className="flex justify-between">
      <p>Override Scope</p>
      <select
        className="border rounded px-2"
        onChange={(e) => setOverrideScope(e.target.value)}
        value={overrideScope}
      >
        <option value="all">All Sites</option>
        <option value="granular">Granular</option>
      </select>
    </div>
  );
}
