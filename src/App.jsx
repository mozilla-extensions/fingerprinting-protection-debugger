import PropTypes from "prop-types";
import { useEffect } from "react";
import BlockingMessage from "./components/BlockingMessage";
import SearchBox from "./components/SearchBox";
import SetAllButtons from "./components/SetAllButtons";
import TargetList from "./components/TargetList";
import Troubleshooter from "./components/Troubleshooter";
import useStore from "./state";
import Notifications from "./components/Notifications";

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
      <Notifications />
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
  const [targets, troubleshooter, setBlockingMessage, notifications] =
    useStore((state) => [
      state.targets,
      state.troubleshooter,
      state.blockingMessage.set,
      state.notifications,
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
      const id = "fpp-not-enabled";
      notifications.add({
        id,
        message: "Fingerprinting protection is not enabled!",
        action: async () => {
          await targets.enable();
          notifications.remove(id);
        },
        actionLabel: "Enable",
      });
    }

    if (targets.invalid.length !== 0) {
      notifications.add({
        id: "unsupported-targets",
        message: `Overrides contain the following unsupported targets, ${
          " " + targets.invalid.join(", ")
        }. The extension will erase them when you make changes.`,
      });
    }

    const conditions = [loaded];
    if (conditions.every((c) => c)) {
      setBlockingMessage("");
    }
  }, [targets, troubleshooter, setBlockingMessage, notifications]);

  return null;
}
