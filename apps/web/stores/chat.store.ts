import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ChatStore {
  messages: any[];
}

export const useChatStore = create(
  subscribeWithSelector<ChatStore>((set, get) => ({
    messages: [],
  }))
);
