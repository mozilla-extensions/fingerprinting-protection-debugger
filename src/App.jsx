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
    state.blockingMessage.message,
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
  const [targets, setBlockingMessage] = useStore((state) => [
    state.targets,
    state.blockingMessage.set,
  ]);

  useEffect(() => {
    if (!targets.enabled) {
      setBlockingMessage(
        "Fingerprinting protection is not enabled Enable it by setting privacy.fingerprintingProtection to true."
      );
    }

    if (targets.invalid.length !== 0) {
      setBlockingMessage(
        `Overrides contains unsupported targets. Remove the following targets to use the extension: ${
          " " + targets.invalid.join(", ")
        }`
      );
    }

    const conditions = [targets.enabled, targets.invalid.length === 0];
    if (conditions.every((c) => c)) {
      setBlockingMessage("");
    }
  }, [targets.enabled, targets.invalid, setBlockingMessage]);

  return null;
}

Layout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};
