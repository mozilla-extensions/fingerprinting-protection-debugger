import { useEffect } from "react";

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
      <SearchBox />
      <TargetList />
    </Layout>
  );
}

function Layout({ children }) {
  return <div className="my-3 mx-4">{children}</div>;
}
