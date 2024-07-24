import { useState } from "react";
import useStore from "../state";

export default function SetAllButtons() {
  const [isGranular, setIsGranular] = useState(false);
  const targets = useStore((state) => state.targets);

  return (
    <div className="inline-flex w-full" role="group">
      <button
        className="p-1.5 w-full text-sm bg-white border border-gray-200 rounded-s-lg"
        onClick={() => targets.setAll(true, isGranular)}
      >
        Enable All
      </button>
      <button
        className="p-1.5 w-full text-sm bg-white border-t border-b border-gray-200"
        onClick={() => targets.setAll(false, isGranular)}
      >
        Disable All
      </button>
      <button
        className="p-1.5 w-full text-sm bg-white border-t border-b border-gray-200"
        onClick={() => targets.resetToDefaults(isGranular)}
      >
        Defaults
      </button>
      <button
        className="p-1.5 w-full text-sm bg-white border border-gray-200 rounded-e-lg"
        onClick={() => setIsGranular(!isGranular)}
      >
        {isGranular ? "Domain" : "All Sites"}
      </button>
    </div>
  );
}
