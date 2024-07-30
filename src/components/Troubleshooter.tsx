import useStore from "../store";

export default function Troubleshooter() {
  const state = useStore((state) => state.troubleshooter);

  if (state.message !== "") {
    return (
      <div className="p-1.5 w-full text-sm border rounded-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {state.message}
      </div>
    );
  }

  if (state.isTroubleshooting()) {
    return <NextButton />;
  } else {
    return <StartButton />;
  }
}

function StartButton() {
  const [troubleshooter, targets] = useStore((state) => [
    state.troubleshooter,
    state.targets,
  ]);

  const start = async () => {
    const range: [number, number] = [0, targets.available.length - 1];
    await troubleshooter.setRange(range[0], range[1]);
    await troubleshooter.saveBeginningTargets();
    await targets.setAll(false, false);
    await targets.clear(true);
    const newOverrides = half(range, targets.available, "left");
    for (const target of newOverrides) {
      await targets.set(target, true, false);
    }
  };

  return (
    <button
      className="p-1.5 w-full text-sm border rounded-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      onClick={start}
    >
      Troubleshoot Website
    </button>
  );
}

function NextButton() {
  const [troubleshooter, targets, domain] = useStore((state) => [
    state.troubleshooter,
    state.targets,
    state.activeTab.domain,
  ]);

  const setOverrides = async (newOverrides: browser.fppOverrides.Target[]) => {
    await targets.setAll(false, false);
    for (const target of newOverrides) {
      await targets.set(target, true, false);
    }
  };

  const onSolved = async () => {
    const direction =
      whichHalf(troubleshooter.range, targets.available, targets.global) ===
      "left"
        ? "right"
        : "left";
    const newOverrides = half(
      troubleshooter.range,
      targets.available,
      direction
    );
    if (newOverrides.length === 1) {
      troubleshooter.setMessage(
        `Troubleshooting complete! ${newOverrides[0]} was causing the breakage.`
      );
      setTimeout(() => {
        troubleshooter.setMessage("");
      }, 7500);
      onCancel();
      return;
    }
    await setOverrides(newOverrides);
  };

  const onNotSolved = async () => {
    const direction =
      whichHalf(troubleshooter.range, targets.available, targets.global) ===
      "left"
        ? "left"
        : "right";
    const newRange = getRange(troubleshooter.range, direction);
    await troubleshooter.setRange(newRange[0], newRange[1]);
    const newOverrides = half(newRange, targets.available, direction);
    await setOverrides(newOverrides);
  };

  const onCancel = async () => {
    await targets.setAll(false, false);
    Object.entries(troubleshooter.beginningTargets.global).forEach(
      ([target, enabled]) => {
        targets.set(target, enabled, false);
      }
    );
    Object.entries(troubleshooter.beginningTargets.granular).forEach(
      ([target, enabled]) => {
        targets.set(target, enabled, true);
      }
    );
    await troubleshooter.setRange(0, 0);
  };

  const forgetWebsite = async () => {
    await browser.fppOverrides.forgetWebsite(domain);
  };

  return (
    <div className="inline-flex w-full" role="group">
      <button
        className="p-1.5 w-full text-sm border rounded-s-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={onSolved}
      >
        Solved
      </button>
      <button
        className="p-1.5 w-full text-sm border-t border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={onNotSolved}
      >
        Not Solved
      </button>
      <button
        className="p-1.5 w-full text-sm border border-t border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        className="p-1.5 w-full text-sm border rounded-e-lg border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        onClick={forgetWebsite}
      >
        Forget Website
      </button>
    </div>
  );
}

// Returns which half of the targets were enabled during the last iteration
function whichHalf(
  range: [number, number],
  availableTargets: browser.fppOverrides.Target[],
  overrides: Record<browser.fppOverrides.Target, boolean>
) {
  const mid = Math.floor((range[0] + range[1]) / 2);
  if (overrides[availableTargets[mid]]) {
    return "left";
  }
  return "right";
}

function getRange(
  range: [number, number],
  direction: "left" | "right"
): [number, number] {
  const mid = Math.floor((range[0] + range[1]) / 2);
  let start = range[0];
  let end = mid;
  if (direction === "right") {
    start = mid + 1;
    end = range[1];
  }
  return [start, end];
}

// Returns the range and half of the available targets based on the direction and the range
function half(
  range: [number, number],
  availableTargets: browser.fppOverrides.Target[],
  direction: "left" | "right"
) {
  const [start, end] = getRange(range, direction);
  const half = [];
  for (let i = start; i <= end; i++) {
    half.push(availableTargets[i]);
  }
  return half;
}
