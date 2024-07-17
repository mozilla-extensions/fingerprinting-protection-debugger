import { useEffect } from "react";
import PropTypes from "prop-types";

import TargetList from "./components/TargetList";
import SearchBox from "./components/SearchBox";
import SetAllButtons from "./components/SetAllButtons";
import InvalidTargets from "./components/InvalidTargets";
import { useStore } from "./state";

export default function App() {
  const [load, invalidTargets] = useStore((state) => [
    state.targets.load,
    state.targets.invalid,
  ]);

  useEffect(() => {
    if (load) load();
  }, [load]);

  if (invalidTargets.length !== 0) {
    return (
      <Layout>
        <InvalidTargets />
      </Layout>
    );
  }

  return (
    <Layout>
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
