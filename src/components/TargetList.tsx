import { useState } from "react";
import useStore from "../store";
import Search from "./Search";
import TargetCheckbox from "./TargetCheckbox";

export default function TargetList() {
  const targets = useStore((state) => state.targets);
  const [query, setQuery] = useState("");

  const targetData = targets.available
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .map((name) => ({
      name,
      global: targets.global[name] ?? false,
      granular: targets.granular[name] ?? false,
      isGranularlySet: targets.granular[name] !== undefined,
      isDefault: targets.defaults.has(name),
    }));

  return (
    <main className="flex flex-col gap-1">
      <Search query={query} set={setQuery} />
      <div>
        {targetData.map((target) => (
          <TargetCheckbox key={target.name} target={target} />
        ))}
      </div>
    </main>
  );
}
