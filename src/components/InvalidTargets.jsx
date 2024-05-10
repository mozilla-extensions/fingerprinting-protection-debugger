import { useStore } from "../state";

export default function SetAllButtons() {
  const invalidTargets = useStore((state) => state.targets.invalid);

  return (
    <div className="space-y-4">
      <p>
        Overrides contains unsupported targets. Remove the following targets to use the extension:
        {" " + invalidTargets.join(", ")}
      </p>
    </div>
  );
}
