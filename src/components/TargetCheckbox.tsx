import useStore from "../store";
import { splitCamelCase } from "../utils";

export default function TargetCheckbox({ target }: props) {
  const setTarget = useStore((state) => state.targets.set);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    await setTarget(target.name, event.target.checked);
  }

  const checkboxAriaLabel = target.enabled
    ? "Target enabled"
    : "Target disabled";

  return (
    <div
      className={
        "flex justify-between items-center px-1 rounded gap-x-10" +
        (target.isDefault ? " bg-yellow-300 dark:bg-yellow-900" : "")
      }
    >
      <div className="flex gap-1 items-center">
        <input
          id={target.name}
          type="checkbox"
          className="rounded border-gray-300 w-4 h-4"
          aria-label={checkboxAriaLabel}
          checked={target.enabled}
          onChange={onChange}
        />
        <label
          htmlFor={target.name}
          className="text-sm leading-6"
          aria-label={
            (target.isDefault ? "Default RFP target " : "") +
            splitCamelCase(target.name)
          }
        >
          {target.name}
        </label>
      </div>
    </div>
  );
}

type props = {
  target: {
    name: string;
    enabled: boolean;
    isDefault: boolean;
  };
};
