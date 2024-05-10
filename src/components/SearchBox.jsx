import { useStore } from "../state";

export default function SearchBox() {
  const [query, setQuery] = useStore((state) => [
    state.searchQuery,
    state.setSearchQuery,
  ]);

  const onQueryChange = (e) => setQuery(e.target.value);

  return (
    <input
      type="search"
      onChange={onQueryChange}
      value={query}
      className="flex p-2 my-2 w-full rounded border"
      placeholder="Search"
    />
  );
}