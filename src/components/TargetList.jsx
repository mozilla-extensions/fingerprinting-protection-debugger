import { useMemo } from "react";
import useStore from "../state";
import TargetCheckbox from "./TargetCheckbox";

export default function TargetList() {
  const [query, targets] = useStore((state) => [
    state.search.query,
    state.targets,
  ]);

  const list = useMemo(() => {
    return targets.available.filter((t) =>
      t.toLowerCase().includes(query.toLowerCase())
    );
  }, [targets, query]);

  return (
    <div>
      {list.map((name) => (
        <TargetCheckbox
          key={name}
          name={name}
        />
      ))}
    </div>
  );
}
