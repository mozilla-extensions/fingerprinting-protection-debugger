import { useState } from "react";
import HomePage from "../pages/HomePage";

export default function PageManager() {
  const [tab, setTab] = useState(0);

  return (
    <>
      {
        // Hide the tabs/navigation as we only have one tab
      }
      <div className="flex gap-2 justify-between border-b-2 hidden">
        {tabs.map((t, i) => (
          <button
            key={i}
            className={tab === i ? "border-b-2 border-black" : ""}
            onClick={() => setTab(i)}
          >
            {t.name}
          </button>
        ))}
      </div>
      {tabs[tab].component}
    </>
  );
}

const tabs = [{ name: "Home", component: <HomePage /> }];
