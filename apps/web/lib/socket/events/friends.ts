import { useFriendStore } from "@/stores/friend.store";
import { getSession } from "next-auth/react";
import { Socket } from "socket.io-client";
export function listenFriendEvents(socket: Socket) {
  socket.emit("online");
  initFriendRequests();
  socket.on("friend-online", (friend: { uid: string, ack?: boolean }) => {
    useFriendStore.setState((state) => ({
      onlineFriends: [...new Set([...state.onlineFriends, friend.uid])],
    }));
    //return if this already was the ack postback
    if (friend.ack) return;
    socket.emit("ack-friend-online", { uid: friend.uid })
  });
  socket.on("friend-offline", (friend: { uid: string }) => {
    useFriendStore.setState((state) => ({
      ...state,
      onlineFriends: state.onlineFriends.filter((uid) => uid !== friend.uid),
    }));
  });
  socket.on("friendship-request", (data: { from: string; to: string }) => {
    useFriendStore.setState((state) => ({
      friendRequests: [
        ...state.friendRequests,
        { from: data.from, to: data.to },
      ],
    }));
  });
  socket.on("friendship-accept", () => {
    initFriendRequests();
  });
  socket.on("friendship-accept-by-request", (data) => {
    useFriendStore.setState((state) => ({
      ...state,
      friendRequests: state.friendRequests.filter(
        (req) => req.from !== data.from
      ),
    }));
  });
  socket.on("online-friends", (data: string[]) => {
    useFriendStore.setState((state) => ({
      ...state,
      onlineFriends: data,
    }));
  });
}

export async function initFriendRequests() {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/friends/requests`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const data = await res.json();
  if (res.status !== 200) {
    return;
  }
  useFriendStore.setState((state) => {
    return {
      ...state,
      friendRequests: data.map((req: any) => ({
        from: req.from,
        to: req.to,
      })),
    };
  });
}
