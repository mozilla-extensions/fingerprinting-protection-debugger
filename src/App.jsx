import PropTypes from "prop-types";
import BlockingMessage from "./components/BlockingMessage";
import Notifications from "./components/Notifications";
import ReadinessChecker from "./components/ReadinessChecker";
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
