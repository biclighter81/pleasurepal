import { getSession } from "next-auth/react";
import { io } from "socket.io-client";
import { listenFriendEvents } from "./events/friends";
import { listenChatEvents } from "./events/chat";
import { listenSessionEvents } from "./events/session";
import { useAppStore } from "@/stores/app.store";
export const initSocket = async (withCredentials?: boolean) => {
  console.log("initSocket production mode: " + withCredentials);
  const session = await getSession();
  const socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    autoConnect: false,
    withCredentials: withCredentials,
  });
  socket.auth = {
    token: session?.access_token,
  };
  socket.connect();
  socket.on("error", (err) => {
    console.log("socket error: " + err);
  });
  socket.on("connect", () => {
    console.log("socket connected");
    useAppStore.setState((state) => ({ ...state, socket: socket }));
    listenSessionEvents(socket);
    listenFriendEvents(socket);
    listenChatEvents(socket);
  });
  return socket;
};
