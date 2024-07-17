import { useMemo } from "react";

import TargetCheckbox from "./TargetCheckbox";
import { useStore } from "../state";

export default function TargetList() {
  const [query, { defaults, overrides, targets }] = useStore((state) => [
    state.searchQuery,
    state.targets,
  ]);

  const list = useMemo(
    () =>
      targets
        .map((t) => ({
          name: t,
          checked: Boolean(overrides[t]),
          isDefault: defaults.includes(t),
        }))
        .filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [targets, defaults, overrides, query]
  );

  return (
    <div>
      {list.map((target) => (
        <TargetCheckbox
          key={target.name}
          name={target.name}
          checked={target.checked}
          isDefault={target.isDefault}
        />
      ))}
    </div>
  );
}
