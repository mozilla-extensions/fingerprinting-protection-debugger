import PropTypes from "prop-types";

export default function BlockingMessage({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p>
        {message}
      </p>
    </div>
  );
}

BlockingMessage.propTypes = {
  message: PropTypes.string.isRequired
};
