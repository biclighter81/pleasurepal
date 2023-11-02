import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface SessionStore {
  sessionInvites: any[];
}

export const useSessionStore = create(
  subscribeWithSelector<SessionStore>((set, get) => ({
    sessionInvites: [],
  }))
);
