import PropTypes from "prop-types";
import BlockingMessage from "./components/BlockingMessage";
import Notifications from "./components/Notifications";
import ReadinessChecker from "./components/ReadinessChecker";
import PageManager from "./components/PageManager";
import useStore from "./state";

export default function App() {
  const [blockingMessage] = useStore((state) => [
    state.blockingMessage.message,
  ]);

  if (blockingMessage) {
    return (
      <Layout>
        <BlockingMessage message={blockingMessage} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Notifications />
      <PageManager />
    </Layout>
  );
}

function Layout({ children }) {
  return (
    <div className="flex flex-col gap-2 m-3 w-96">
      <ReadinessChecker />
      {children}
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};
