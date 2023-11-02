import { useFriendStore } from "@/stores/friend.store";
import { getSession } from "next-auth/react";
import { initFriendRequests } from "../socket/events/friends";

async function acceptReq(uid: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/friends/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        uid,
      }),
    }
  );
  await res.json();
  if (res.status === 201) {
    useFriendStore.setState({
      friendRequests: useFriendStore
        .getState()
        .friendRequests.filter((request) => request.from !== uid),
    });
    await initFriendRequests();
  } else {
    console.log("Ooops! Something went wrong!");
  }
}

async function declineReq(uid: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/friends/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        uid,
      }),
    }
  );
  await res.json();
  if (res.status === 201) {
    useFriendStore.setState({
      friendRequests: useFriendStore
        .getState()
        .friendRequests.filter((request) => request.from !== uid),
    });
  } else {
    console.log("Ooops! Something went wrong!");
  }
}

async function blockUser(uid: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/friends/block`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        uid,
      }),
    }
  );
  await res.json();
  if (res.status === 201) {
    useFriendStore.setState({
      friendRequests: useFriendStore
        .getState()
        .friendRequests.filter((request) => request.from !== uid),
    });
  } else {
    console.log("Ooops! Something went wrong!");
  }
}

async function requestFriendship(uid: string) {
  const session = await getSession();
  await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/friends/request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session?.access_token,
      },
      body: JSON.stringify({
        uid,
      }),
    }
  );
}

async function fetchFriend(friendUid: string) {
  const session = await getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PLEASUREPAL_API}/api/friends/friend/${friendUid}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
    }
  );
  return res;
}

export { acceptReq, declineReq, blockUser, requestFriendship, fetchFriend };
