'use client';

import React, { useEffect } from "react";
import { useAppStore } from "../../stores/app.store";
import { initSocket } from "../socket/socket";
import { Socket } from "socket.io-client";

export default function SocketProvider({
    children
}: {
    children: React.ReactNode
}) {
    const appStore = useAppStore();
    useEffect(() => {
        let socket: Socket | undefined;
        initSocket(appStore.isProduction).then((s) => {
            socket = s;
        });
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);
    return <>
        {children}
    </>
}