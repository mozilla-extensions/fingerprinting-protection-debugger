import { useEffect } from "react";
import useStore from "../state";

export default function ReadinessChecker() {
  const [
    targets,
    troubleshooter,
    setBlockingMessage,
    notifications,
    activeTab,
  ] = useStore((state) => [
    state.targets,
    state.troubleshooter,
    state.blockingMessage.set,
    state.notifications,
    state.activeTab,
  ]);

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

  // Keep track of the active tab's domain
  useEffect(() => {
    if (!loaded) return;

    const setActiveTabDomain = async (tab) => {
      if (!tab.url) return;
      const url = new URL(tab.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        notifications.add({
          id: "non-http",
          message: "This extension only works on HTTP and HTTPS sites.",
          action: () => notifications.remove("non-http"),
          actionLabel: "Dismiss",
        });
        return;
      }
      await activeTab.set(url.hostname);
      await targets.loadOverrides(url.hostname);
    };

    browser.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(([tab]) => setActiveTabDomain(tab));

    const listener = (_tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete") setActiveTabDomain(tab);
    };
    browser.tabs.onUpdated.addListener(listener);

    return () => browser.tabs.onUpdated.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

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
        message: `Unsupported targets were found (${targets.invalid.join(
          ", "
        )}). The extension will erase them when you make changes.`,
        action: () => {
          targets.clearInvalidTargets();
          notifications.remove("unsupported-targets");
        },
        actionLabel: "Dismiss",
      });
    }
  }, [loaded, notifications, targets]);

  return null;
}
