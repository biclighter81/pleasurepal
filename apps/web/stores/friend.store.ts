import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface FriendStore {
  onlineFriends: string[];
  friendRequests: { from: string; to: string }[];
}

export const useFriendStore = create(
  subscribeWithSelector<FriendStore>((set, get) => ({
    onlineFriends: [],
    friendRequests: [],
  }))
);
