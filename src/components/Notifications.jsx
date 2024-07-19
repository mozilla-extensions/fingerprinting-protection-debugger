import PropTypes from "prop-types";
import useStore from "../state";

export default function Notifications() {
  const state = useStore((state) => state.notifications);

  return state.notifications.map((notification) => (
    <Notification key={notification.id} notification={notification} />
  ));
}

function Notification({ notification }) {
  return (
    <div className="p-2 bg-blue-100 rounded flex justify-between gap-2">
      <p className="break-all">{notification.message}</p>
      {notification.action && (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white px-2 rounded"
          onClick={() => notification.action()}
        >
          {notification.actionLabel}
        </button>
      )}
    </div>
  );
}

Notification.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    action: PropTypes.func,
    actionLabel: PropTypes.string,
  }).isRequired,
};
