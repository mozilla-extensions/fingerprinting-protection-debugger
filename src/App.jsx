import PropTypes from "prop-types";
import { useEffect } from "react";
import BlockingMessage from "./components/BlockingMessage";
import SearchBox from "./components/SearchBox";
import SetAllButtons from "./components/SetAllButtons";
import TargetList from "./components/TargetList";
import Troubleshooter from "./components/Troubleshooter";
import useStore from "./state";

export default function App() {
  const [blockingMessage] = useStore((state) => [
    state.blockingMessage.message,
  ]);

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
      <Troubleshooter />
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

Layout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

function ReadinessChecker() {
  const [targets, troubleshooter, setBlockingMessage] = useStore((state) => [
    state.targets,
    state.troubleshooter,
    state.blockingMessage.set,
  ]);

  useEffect(() => {
    if (!targets.loaded) targets.load();
  }, [targets]);

  useEffect(() => {
    if (!troubleshooter.loaded) troubleshooter.load();
  }, [troubleshooter]);

  useEffect(() => {
    const loaded = targets.loaded && troubleshooter.loaded;
    if (!loaded) {
      setBlockingMessage("Loading...");
      return;
    }

    if (!targets.enabled) {
      setBlockingMessage(
        "Fingerprinting protection is not enabled. Enable it by setting privacy.fingerprintingProtection to true."
      );
      return;
    }

    if (targets.invalid.length !== 0) {
      setBlockingMessage(
        `Overrides contain unsupported targets. Remove these targets to use the extension: ${
          " " + targets.invalid.join(", ")
        }`
      );
      return;
    }

    const conditions = [targets.enabled, targets.invalid.length === 0, loaded];
    if (conditions.every((c) => c)) {
      setBlockingMessage("");
    }
  }, [targets, troubleshooter, setBlockingMessage]);

  return null;
}
