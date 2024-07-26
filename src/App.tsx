import BlockingMessage from "./components/BlockingMessage";
import InitialStateLoader from "./components/InitialStateLoader";
import Navigation from "./components/Navigation";
import Notifications from "./components/Notifications";
import Home from "./pages/Home";

const tabs = [{ name: "Home", component: <Home /> }];

function App() {
  return (
    <div className="flex flex-col gap-2 p-2 break-words font-sans bg-white dark:bg-slate-900 text-black dark:text-slate-200">
      <InitialStateLoader />
      <BlockingMessage />
      <Notifications />
      <Navigation tabs={tabs} />
    </div>
  );
}

export default App;
