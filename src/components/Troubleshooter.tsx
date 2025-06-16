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
    await targets.setAll(false);
    await targets.clear();
    const newOverrides = half(range, targets.available, "top");
    for (const target of newOverrides) {
      await targets.set(target, true);
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
  const [troubleshooter, targets] = useStore((state) => [
    state.troubleshooter,
    state.targets,
  ]);

  const setOverrides = async (newOverrides: browser.fppOverrides.Target[]) => {
    await targets.setAll(false);
    for (const target of newOverrides) {
      await targets.set(target, true);
    }
  };

  const onSolved = async () => {
    const direction =
      whichHalf(troubleshooter.range, targets.available, targets.overrides) ===
        "top"
        ? "bottom"
        : "top";
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
    const direction = whichHalf(
      troubleshooter.range,
      targets.available,
      targets.overrides
    );
    const newRange = getRange(troubleshooter.range, direction);
    // Only one target was active previously and it is still not solved
    // i.e. we don't have any other targets to disable
    if (
      newRange[0] === newRange[1] &&
      troubleshooter.range[1] - troubleshooter.range[0] === 1
    ) {
      troubleshooter.setMessage(
        `Troubleshooting complete! ${targets.available[troubleshooter.range[0]]
        } and ${targets.available[troubleshooter.range[1]]
        } was causing the breakage.`
      );
      setTimeout(() => {
        troubleshooter.setMessage("");
      }, 7500);
      onCancel();
      return;
    }
    await troubleshooter.setRange(newRange[0], newRange[1]);
    const newOverrides = half(newRange, targets.available, direction);
    await setOverrides(newOverrides);
  };

  const onCancel = async () => {
    await targets.setAll(false);
    Object.entries(troubleshooter.beginningTargets).forEach(
      ([target, enabled]) => {
        targets.set(target, enabled);
      }
    );
    await troubleshooter.setRange(0, 0);
  };

  const forgetWebsite = async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      return;
    }
    const url = new URL(tabs[0].url || "");
    await browser.fppOverrides.forgetWebsite(url.hostname);
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
    return "top";
  }
  return "bottom";
}

function getRange(
  range: [number, number],
  direction: "top" | "bottom"
): [number, number] {
  const mid = Math.floor((range[0] + range[1]) / 2);
  let start = range[0];
  let end = mid;
  if (direction === "bottom") {
    start = mid + 1;
    end = range[1];
  }
  return [start, end];
}

// Returns the range and half of the available targets based on the direction and the range
function half(
  range: [number, number],
  availableTargets: browser.fppOverrides.Target[],
  direction: "top" | "bottom"
) {
  const [start, end] = getRange(range, direction);
  const half = [];
  for (let i = start; i <= end; i++) {
    half.push(availableTargets[i]);
  }
  return half;
}
