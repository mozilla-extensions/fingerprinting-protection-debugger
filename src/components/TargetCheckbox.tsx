import { useEffect, useRef } from "react";
import useStore from "../store";
import { splitCamelCase } from "../utils";

export default function TargetCheckbox({ target }: props) {
  const [setTarget, removeTarget] = useStore((state) => [
    state.targets.set,
    state.targets.remove,
  ]);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const isGranular = false;

  const wrongScope = target.isGranularlySet && !isGranular;
  const granularlyDisabled = target.isGranularlySet && !target.granular;

  useEffect(() => {
    if (!checkboxRef.current) return;

    const checkbox = checkboxRef.current;

    if (granularlyDisabled) {
      checkbox.checked = false;
      checkbox.indeterminate = true;
      return;
    }

    checkbox.checked = target.global || target.granular;
    checkbox.indeterminate = false;
  });

  async function onClick(e: React.MouseEvent<HTMLInputElement>) {
    e.preventDefault();

    if (wrongScope) {
      return;
    }

    const checkbox = checkboxRef.current!;

    if (granularlyDisabled) {
      await removeTarget(target.name, isGranular);
      return;
    }

    setTarget(target.name, checkbox.checked, isGranular);
  }

  // Disabled because we are removing the scope button.
  // We can use this code later if we decide to add it back.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scopeButtonAriaLabel = wrongScope
    ? isGranular
      ? "Current scope is domain. Click to change to all sites"
      : "Current scope is all sites. Click to change to domain"
    : "";

  const checkboxAriaLabel = granularlyDisabled
    ? "Granularly disabled"
    : target.global || target.granular
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
          ref={checkboxRef}
          onClick={onClick}
          aria-label={checkboxAriaLabel}
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
    global: boolean;
    granular: boolean;
    isGranularlySet: boolean;
    isDefault: boolean;
  };
};
