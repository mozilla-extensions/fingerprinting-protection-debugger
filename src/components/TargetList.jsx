import { useMemo } from "react";

import TargetCheckbox from "./TargetCheckbox";
import { useStore } from "../state";

export default function TargetList() {
  const [query, targets] = useStore((state) => [
    state.search.query,
    state.targets,
  ]);

  const list = useMemo(
    () =>
      targets.available
        .map((t) => ({
          name: t,
          checked: Boolean(targets.overrides[t]),
          isDefault: targets.defaults.includes(t),
        }))
        .filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [targets, query]
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
