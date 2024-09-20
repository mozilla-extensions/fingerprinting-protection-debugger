import { useEffect } from "react";
import useStore from "../store";

export default function InitialStateLoader() {
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
  useEffect(() => {
    if (!targets.ready) targets.load();
    if (!troubleshooter.ready) troubleshooter.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = targets.ready && troubleshooter.ready;
  // Show a blocking message while the app is loading
  useEffect(() => {
    if (!ready) {
      setBlockingMessage("Loading...");
      return;
    }

    setBlockingMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Keep track of the active tab's domain
  useEffect(() => {
    if (!ready) return;

    const setActiveTabDomain = async (tab: browser.tabs.Tab) => {
      if (!tab.url) return;
      const url = new URL(tab.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        const id = "non-http";
        notifications.add({
          id,
          message: "This extension only works on HTTP and HTTPS sites.",
          action: () => notifications.remove(id),
          actionLabel: "Dismiss",
        });
        return;
      }
      activeTab.set(url.hostname);
    };

    browser.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(([tab]) => setActiveTabDomain(tab));

    const listener = ({ tabId }: { tabId: number }) => {
      browser.tabs.get(tabId).then(setActiveTabDomain);
    };
    browser.tabs.onActivated.addListener(listener);

    return () => browser.tabs.onActivated.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

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
    if (targets.invalids.length !== 0) {
      const id = "unsupported-targets";
      notifications.add({
        id,
        message: `Unsupported targets were found (${targets.invalids.join(
          ", "
        )}). The extension will erase them when you make changes.`,
        action: async () => {
          targets.clearInvalids();
          notifications.remove(id);
        },
        actionLabel: "Dismiss",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}
