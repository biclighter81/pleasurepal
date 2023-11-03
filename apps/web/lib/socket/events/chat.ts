import { useChatStore } from '@/stores/chat.store';
import { Socket } from 'socket.io-client';

export function listenChatEvents(socket: Socket) {
  socket.on('message', (data, callback) => {
    const path = window.location.pathname;
    let read: boolean;
    //emit read if the user is in the chat page otherwise add the message to the store
    if (path.includes('chat') && (path.includes(data.conversation.id) || path.includes(data.sender))) {
      callback({ read: true })
      read = true
    }
    useChatStore.setState((state) => ({
      ...state,
      messages: [...state.messages, { ...data, read }],
    }));
  });
  socket.on('conversation-read', (data) => {
    useChatStore.getState().setReadState(data.conversationId, data.participantId)
  })
}
