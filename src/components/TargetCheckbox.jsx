import PropTypes from "prop-types";
import useStore from "../state";
import { useEffect, useRef, useState } from "react";

export default function TargetCheckbox({ name }) {
  const targets = useStore((state) => state.targets);
  const [isGranular, setIsGranular] = useState(false);

  const isDefault = targets.defaults.includes(name);
  const checkboxRef = useRef();

  useEffect(() => {
    if (targets.granular[name] != null) {
      checkboxRef.current.checked = targets.granular[name];
      checkboxRef.current.indeterminate = !targets.granular[name];
    } else if (targets.global[name] != null) {
      checkboxRef.current.checked = targets.global[name];
      checkboxRef.current.indeterminate = false;
    }

    if (targets.global[name] == null && targets.granular[name] == null) {
      checkboxRef.current.checked = targets.global[name];
      checkboxRef.current.indeterminate = false;
    }
  });

  const wrongScope = targets.granular[name] != null && !isGranular;

  function setPreference(e) {
    e.preventDefault();
    const checked = e.target.checked;
    if (!isGranular) {
      if (!wrongScope) {
        targets.set(name, checked, false);
      }
      return;
    }

    const indeterminate =
      targets.granular[name] != null && !targets.granular[name];
    if (indeterminate) {
      targets.removeGranularTarget(name);
      return;
    }

    targets.set(name, checked, true);
  }

  return (
    <div
      className={
        "flex justify-between items-center px-1" +
        (isDefault ? " bg-yellow-200" : "")
      }
    >
      <div className="flex gap-x-3 items-center">
        <input
          id={name}
          type="checkbox"
          className="rounded border-gray-300"
          ref={checkboxRef}
          onClick={setPreference}
        />
        <label htmlFor={name} className="text-sm leading-6 break-words">
          {name}
        </label>
      </div>
      <button
        className={"text-sm" + (wrongScope ? " text-red-500" : "")}
        onClick={() => setIsGranular(!isGranular)}
      >
        {isGranular ? "Domain" : "All Sites"}
      </button>
    </div>
  );
}

TargetCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
};
