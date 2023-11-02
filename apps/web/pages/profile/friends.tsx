import { useState } from "react";
import { IconMessageCircle2, IconUserSearch } from "@tabler/icons-react";
import { createAvatar } from "@dicebear/core";
import { identicon } from "@dicebear/collection";
import { requestFriendship } from "@/lib/functions/friends";
import useDebounce from "@/lib/hooks/useDebounce";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSession } from "next-auth/react";
import { useFriendStore } from "@/stores/friend.store";
import { useRouter } from "next/router";
import { Friend, User } from "@/lib/types/friend";

export default function Friends() {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const router = useRouter();

  const { data: friends, isLoading } = useSWR<Friend[]>("friends", fetcher);
  const { data: users } = useSWR<User[]>(
    `user/search?q=${debouncedSearch}`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );
  const { data: session } = useSession();
  const friendStore = useFriendStore();

  function getAvatar(email: string) {
    const avatar = createAvatar(identicon, {
      seed: email,
      size: 28,
    });
    return avatar;
  }

  return (
    <>
      <div className="px-8 py-8">
        <div>
          <h1 className="text-4xl uppercase font-bold">Friends</h1>
          <span className="text-sm">
            Find friends and start a conversation!
          </span>
        </div>
        <div className="mt-4 flex flex-col">
          <div className="bg-dark px-4 py-2 rounded-lg flex items-center space-x-4">
            <IconUserSearch className="h-5 w-5" />
            <input
              type="text"
              placeholder="Search user"
              className="bg-transparent w-full ring-0 outline-none text-sm font-light text-gray-400"
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
        <div
          className={`mt-2 ${
            !users?.length && "hidden"
          } max-h-[200px] overflow-y-auto`}
        >
          {users?.length && (
            <div className="flex flex-col space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex bg-dark px-6 py-4 rounded-lg items-center space-x-6"
                  onClick={() => requestFriendship(u.id)}
                >
                  <div className="flex items-center space-x-2 h-5 w-5">
                    <img src={getAvatar(u.email).toDataUriSync()} />
                  </div>
                  <h5 className="uppercase font-bold text-xs">{u.username}</h5>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-xl uppercase mt-4">My friends</h3>
            <p className="text-xs">
              Online{" "}
              {
                friends?.filter((friend) => {
                  const friendUid =
                    friend.from == session?.sub ? friend.to : friend.from;
                  return friendStore.onlineFriends.includes(friendUid);
                }).length
              }{" "}
              / {friends?.length}
            </p>
          </div>
        </div>

        {friends?.length ? (
          <div className="flex flex-col space-y-2">
            {friends.map((friend: any) => {
              const friendUid =
                friend.from == session?.sub ? friend.to : friend.from;
              return (
                <div
                  key={friendUid}
                  className="flex bg-dark px-6 py-4 rounded-lg items-center space-x-6"
                >
                  <div className="flex items-center space-x-2 h-5 w-5">
                    <img src={getAvatar(friendUid).toDataUriSync()} />
                  </div>
                  <div
                    className={`w-2 h-2 ${
                      friendStore.onlineFriends.includes(friendUid)
                        ? "bg-green-400"
                        : "bg-red-400"
                    } rounded-full animate-pulse`}
                  />
                  <h6
                    className="text-sm uppercase font-bold hover:cursor-pointer"
                    onClick={() => {
                      router.push(`/profile/${friendUid}`);
                    }}
                  >
                    {friend.username}
                  </h6>
                  <div className="flex-grow flex items-center justify-end">
                    <div
                      onClick={() => {
                        router.push(`/chat/direct/${friendUid}`);
                      }}
                    >
                      <IconMessageCircle2 className="w-5 h-5 hover:scale-105 hover:cursor-pointer" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </>
  );
}
