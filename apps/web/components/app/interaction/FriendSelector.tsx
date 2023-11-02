import { fetcher } from "@/lib/fetcher";
import useClickOutside from "@/lib/hooks/useClickOutside";
import { Friend } from "@/lib/types/friend";
import { IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import useSWR from "swr";

export default function FriendSelector({
  label,
  selected,
  setSelected,
}: {
  label?: string;
  selected: Friend[];
  setSelected: (f: Friend[]) => void;
}) {
  const { data, isLoading } = useSWR<Friend[]>("friends", fetcher);
  const { ref, isComponentVisible, setIsComponentVisible } =
    useClickOutside(false);
  const [search, setSearch] = useState<string>("");

  const visibleFriends = useMemo<Friend[]>(() => {
    if (!data) return [];
    return data.filter(
      (f) =>
        !selected?.find((s) => s.uid === f.uid) &&
        f.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, selected, search]);

  return (
    <div ref={ref}>
      <label className="text-xs uppercase font-semibold mb-1">{label}</label>
      <div
        className={`ring-0 outline-none text-sm font-light text-gray-400 px-4 py-4 bg-dark ${
          isComponentVisible ? "rounded-t-lg" : "rounded-lg"
        }`}
        onClick={() => {
          setIsComponentVisible(!isComponentVisible);
        }}
      >
        <div className="flex space-x-3">
          {selected &&
            selected.map((f) => (
              <div
                key={f.uid}
                className="bg-zinc-700 px-3 py-1 rounded-md text-sm hover:cursor-pointer text-white flex items-center space-x-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(selected.filter((s) => s.uid !== f.uid));
                }}
              >
                <span>{f.username}</span>
                <div>
                  <IconX className="h-4 w-4" />
                </div>
              </div>
            ))}
          <input
            className="flex-grow bg-transparent ring-0 outline-none text-sm font-light text-gray-400"
            placeholder="Select friends"
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isComponentVisible) setIsComponentVisible(true);
            }}
            value={search}
          />
        </div>
      </div>
      {isComponentVisible && visibleFriends.length > 0 && (
        <div className="bg-dark w-full rounded-b-lg pb-2">
          <div className="flex flex-col space-y-2">
            {visibleFriends.map((f) => (
              <div
                key={f.uid}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <div
                  className="bg-zinc-700 px-3 py-1 rounded-md text-sm hover:cursor-pointer"
                  onClick={() => {
                    setSelected([...(selected || []), f]);
                    setSearch("");
                  }}
                >
                  {f.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
