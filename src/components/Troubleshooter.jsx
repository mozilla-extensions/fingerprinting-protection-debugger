import useStore from "../state";

export default function Troubleshooter() {
  const state = useStore((state) => state.troubleshooter);

  if (state.message !== "") {
    return (
      <div className="p-1.5 w-full text-sm bg-white border border-gray-200 rounded-lg">
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
    const range = [0, targets.available.length - 1];
    await troubleshooter.setRange(range[0], range[1]);
    await troubleshooter.saveBeginningTargets();
    await targets.setAll(false);
    const newOverrides = half(range, targets.available, "left");
    newOverrides.forEach((target) => {
      targets.set(target, true);
    });
  };

  return (
    <button
      className="p-1.5 w-full text-sm bg-white border border-gray-200 rounded-lg"
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

  const setOverrides = async (newOverrides) => {
    await targets.setAll(false);
    for (const target of newOverrides) {
      await targets.set(target, true);
    }
  };

  const onSolved = async () => {
    const direction =
      whichHalf(troubleshooter.range, targets.available, targets.overrides) ===
      "left"
        ? "right"
        : "left";
    const newOverrides = half(
      troubleshooter.range,
      targets.available,
      direction
    );
    if (newOverrides.length === 1) {
      await troubleshooter.setMessage(
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
      whichHalf(troubleshooter.range, targets.available, targets.overrides) ===
      "left"
        ? "left"
        : "right";
    const newRange = getRange(troubleshooter.range, direction);
    await troubleshooter.setRange(newRange[0], newRange[1]);
    const newOverrides = half(newRange, targets.available, direction);
    await setOverrides(newOverrides);
  };

  const onCancel = async () => {
    await targets.setAll(false);
    troubleshooter.beginningTargets.forEach((target) => {
      targets.set(target, true);
    });
    await troubleshooter.setRange(0, 0);
  };

  return (
    <div className="inline-flex w-full" role="group">
      <button
        className="p-1.5 w-full text-sm bg-white border border-gray-200 rounded-s-lg"
        onClick={onSolved}
      >
        Solved
      </button>
      <button
        className="p-1.5 w-full text-sm bg-white border-t border-b border-gray-200"
        onClick={onNotSolved}
      >
        Not Solved
      </button>
      <button
        className="p-1.5 w-full text-sm bg-white border border-gray-200 rounded-e-lg"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

// Returns which half of the targets were enabled during the last iteration
function whichHalf(range, availableTargets, overrides) {
  const mid = Math.floor((range[0] + range[1]) / 2);
  if (overrides[availableTargets[mid]]) {
    return "left";
  }
  return "right";
}

function getRange(range, direction) {
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
function half(range, availableTargets, direction) {
  const [start, end] = getRange(range, direction);
  const half = [];
  for (let i = start; i <= end; i++) {
    half.push(availableTargets[i]);
  }
  return half;
}
