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
  const [targets, troubleshooter, setBlockingMessage, notifications] = useStore(
    (state) => [
      state.targets,
      state.troubleshooter,
      state.blockingMessage.set,
      state.notifications,
    ]
  );

  // Load the targets and troubleshooter data
  useEffect(
    () => {
      if (!targets.loaded) targets.load();
      if (!troubleshooter.loaded) troubleshooter.load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const loaded = targets.loaded && troubleshooter.loaded;
  // Show a blocking message while the app is loading
  useEffect(() => {
    if (!loaded) {
      setBlockingMessage("Loading...");
      return;
    }

    setBlockingMessage("");
  }, [loaded, setBlockingMessage]);

  useEffect(() => {
    if (!loaded) return;

    // Show a notification if fingerprinting protection is not enabled
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

    // Show a notification if unsupported targets are found
    if (targets.invalid.length !== 0) {
      notifications.add({
        id: "unsupported-targets",
        message: `Unsupported targets were found (${
          " " + targets.invalid.join(", ")
        }). The extension will erase them when you make changes.`,
      });
    }
  }, [loaded, notifications, targets]);

  return null;
}
