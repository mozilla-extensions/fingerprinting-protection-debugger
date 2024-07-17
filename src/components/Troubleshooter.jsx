import { useStore } from "../state";

export default function TroubleShooter() {
  const state = useStore((state) => state.troubleshooter);

  if (state.isTroubleshooting()) {
    // return NextButton();
    return <StartButton />;
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
    const mid = Math.floor((range[0] + range[1]) / 2);
    await troubleshooter.setRange(range[0], range[1]);
    await targets.setAll(false);
    for (let i = range[0]; i <= mid; i++) {
      await targets.set(targets.available[i], true);
    }
  };

  return (
    <button
      className="p-2 w-full text-sm bg-white border border-gray-200 rounded-lg"
      onClick={start}
    >
      Troubleshoot Website
    </button>
  );
}
