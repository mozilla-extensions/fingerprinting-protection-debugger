import SearchBox from "../components/SearchBox";
import SetAllButtons from "../components/SetAllButtons";
import TargetList from "../components/TargetList";
import Troubleshooter from "../components/Troubleshooter";

export default function HomePage() {
  return (
    <>
      <Troubleshooter />
      <SetAllButtons />
      <div className="flex flex-col gap-1">
        <SearchBox />
        <TargetList />
      </div>
    </>
  );
}
