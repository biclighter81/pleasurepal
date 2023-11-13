import { Container, injectable } from "inversify";
import { Server, Socket as IOSocket } from "socket.io";
import { createClient } from "redis";
import { env } from "@/env";
import { createAdapter } from "@socket.io/redis-adapter";
import debug from "debug";
import { FriendEventHandler } from "../events/FriendEventHandler";
import { IEventHandler } from "@/lib/interfaces/app";

@injectable()
export class Socket {
    private io: Server;
    private handlers: IEventHandler[] = [];

    private log = debug('socket')
    constructor(container: Container) {
        this.handlers = [
            new FriendEventHandler(container)
        ]
        const io = new Server({
            cors: {
                origin: "*",
            },
        })
        const pubClient = createClient({ url: env.redis.url });
        const subClient = pubClient.duplicate();

        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
            io.adapter(createAdapter(pubClient, subClient));
        });
        io.on('connection', (socket) => {
            //TODO: check auth
            socket.join(socket.handshake.auth.uid)
            this.registerListeners(socket)
        })
        io.listen(8888);
        this.io = io;
        this.log('socket.io listening on port 8888')
    }

    public getServer() {
        return this.io;
    }

    private registerListeners(socket: IOSocket) {
        for (const handler of this.handlers) {
            handler.listen(socket)
        }
    }

}