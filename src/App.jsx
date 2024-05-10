import { useEffect } from "react";

import TargetList from "./components/TargetList";
import SearchBox from "./components/SearchBox";
import SetAllButtons from "./components/SetAllButtons";
import { useStore } from "./state";


export default function App() {
  const load = useStore((state) => state.targets.load);

  useEffect(() => {
    if (load)
      load();
  }, [load]);

  return (
    <div className="my-3 mx-4">
      <SetAllButtons />
      <SearchBox />
      <TargetList />
    </div>
  );
}