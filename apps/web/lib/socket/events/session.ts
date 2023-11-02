import { useSessionStore } from "@/stores/session.store";
import { Socket } from "socket.io-client";

export function listenSessionEvents(socket: Socket) {
  socket.on("pleasure-session-invite", (invite: any) => {
    useSessionStore.setState((state) => ({
      ...state,
      sessionInvites: [...state.sessionInvites, invite],
    }));
  });
  socket.on("pleasure-session-invite-answered", (data: any) => {
    useSessionStore.setState((state) => ({
      ...state,
      sessionInvites: state.sessionInvites.filter(
        (invite) => invite.sessionId !== data.sessionId
      ),
    }));
  });
}
