import useStore from "../store";
import type { Notification as NotificationType } from "../store";

export default function Notifications() {
  const notifications = useStore((state) => state.notifications);

  return notifications.list.map((notification) => (
    <Notification key={notification.id} notification={notification} />
  ));
}

function Notification({ notification }: { notification: NotificationType }) {
  return (
    <div className="p-1.5 rounded flex justify-between gap-2 bg-sky-100 dark:bg-sky-900">
      <p>{notification.message}</p>
      {notification.action && (
        <button
          className="text-sm px-2 rounded bg-sky-400 dark:bg-sky-700"
          onClick={() => notification.action()}
        >
          {notification.actionLabel}
        </button>
      )}
    </div>
  );
}
