import useStore from "../state";

export default function SearchBox() {
  const search = useStore((state) => state.search);

  const onQueryChange = (e) => search.set(e.target.value);

  return (
    <input
      type="search"
      onChange={onQueryChange}
      value={search.query}
      className="p-2 w-full rounded border"
      placeholder="Search"
    />
  );
}
