import { ReactElement, useState } from "react";

export default function Navigation({ tabs }: props) {
  const [tab, setTab] = useState(0);

  if (tabs.length === 0) {
    return <div>No tabs found</div>;
  }

  const navbarClass =
    tabs.length > 1 ? "flex justify-between border-b-2" : "hidden";

  return (
    <>
      <div className={navbarClass} role="navigation">
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

type props = {
  tabs: { name: string; component: ReactElement | ReactElement[] }[];
};
