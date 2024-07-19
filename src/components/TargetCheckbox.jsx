import PropTypes from "prop-types";
import useStore from "../state";

export default function TargetCheckbox({ name, checked, isDefault }) {
  const [overrideScope, setOverride, setGranularOverride] = useStore(
    (state) => [
      state.targets.overrideScope,
      state.targets.set,
      state.targets.setGranularOverride,
    ]
  );
  const setPreference = (e) =>
    overrideScope === "all"
      ? setOverride(name, e.target.checked)
      : setGranularOverride(location.hostname, name, e.target.checked);

  return (
    <div
      className={
        "flex gap-x-3 items-center px-1" + (isDefault ? " bg-yellow-200" : "")
      }
    >
      <input
        id={name}
        type="checkbox"
        className="rounded border-gray-300"
        checked={checked}
        onChange={setPreference}
      />
      <label htmlFor={name} className="text-sm leading-6 break-words">
        {name}
      </label>
    </div>
  );
}

TargetCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  isDefault: PropTypes.bool.isRequired,
};
