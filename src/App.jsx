import { useEffect } from "react";
import PropTypes from "prop-types";

import TargetList from "./components/TargetList";
import SearchBox from "./components/SearchBox";
import SetAllButtons from "./components/SetAllButtons";
import BlockingMessage from "./components/BlockingMessage";
import { useStore } from "./state";

export default function App() {
  const [load, blockingMessage] = useStore((state) => [
    state.targets.load,
    state.blockingMessage,
  ]);

  useEffect(() => {
    if (load) load();
  }, [load]);

  if (blockingMessage) {
    return (
      <Layout>
        <ReadinessChecker />
        <BlockingMessage message={blockingMessage} />
      </Layout>
    );
  }

  return (
    <Layout>
      <ReadinessChecker />
      <SetAllButtons />
      <div className="flex flex-col gap-1">
        <SearchBox />
        <TargetList />
      </div>
    </Layout>
  );
}

function Layout({ children }) {
  return <div className="flex flex-col gap-2 m-3 w-fit">{children}</div>;
}

function ReadinessChecker() {
  const [enabled, invalidTargets, setBlockingMessage] = useStore((state) => [
    state.targets.enabled,
    state.targets.invalid,
    state.setBlockingMessage,
  ]);

  useEffect(() => {
    if (!enabled) {
      setBlockingMessage(
        "Fingerprinting protection is not enabled Enable it by setting privacy.fingerprintingProtection to true."
      );
    }

    if (invalidTargets.length !== 0) {
      setBlockingMessage(
        `Overrides contains unsupported targets. Remove the following targets to use the extension: ${
          " " + invalidTargets.join(", ")
        }`
      );
    }

    const conditions = [enabled, invalidTargets.length === 0];
    if (conditions.every((c) => c)) {
      setBlockingMessage("");
    }
  }, [enabled, invalidTargets, setBlockingMessage]);

  return null;
}

Layout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};
