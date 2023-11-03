import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ChatStore {
  messages: any[];
  conversationReadState: { [conversationId: string]: { [participantId: string]: Date } }
  setReadState: (conversationId: string, participantId: string) => void
}

export const useChatStore = create(
  subscribeWithSelector<ChatStore>((set, get) => ({
    messages: [],
    conversationReadState: {},
    setReadState: (conversationId, participantId) => {
      if (!get().conversationReadState[conversationId]) {
        set((state) => {
          const conversationReadState = state.conversationReadState;
          conversationReadState[conversationId] = {}
          return { conversationReadState }
        })
      }
      set((state) => {
        const conversationReadState = state.conversationReadState;
        conversationReadState[conversationId][participantId] = new Date();
        return { conversationReadState: { ...conversationReadState } }
      })
    }
  }))
);
