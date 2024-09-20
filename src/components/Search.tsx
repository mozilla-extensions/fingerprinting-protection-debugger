export default function Search({ query, set }: props) {
  return (
    <input
      type="search"
      onChange={(e) => set(e.target.value)}
      value={query}
      className="p-1.5 w-full rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      placeholder="Search"
      role="search"
    />
  );
}

type props = {
  query: string;
  set: (query: string) => void;
};
