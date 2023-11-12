import { Container } from "inversify";
import TYPES from "../../lib/symbols";
import { FriendService } from "../services/FriendService";
import { Socket } from "socket.io";

export class FriendEventHandler {

    constructor(
        private container: Container
    ) { }

    public listen(socket: Socket) {
        const friendSrv = this.container.get<FriendService>(TYPES.FriendService)
        socket.on('disconnect', () => this.handleDisconnect(socket, friendSrv))
        socket.on('online', () => {
            const { uid } = socket.handshake.auth;
            friendSrv.emitOnline(uid)
        })
        socket.on('connection', () => {
            console.log('connection')
        })
        socket.on('ack-friend-online', (friend: { uid: string }) => {
            const { uid } = socket.handshake.auth;
            socket.to(friend.uid).emit('friend-online', { uid: uid, ack: true })
        })
    }

    async handleDisconnect(socket: Socket, friendSrv: FriendService) {
        const { uid } = socket.handshake.auth;
        const friends = await friendSrv.getFriends(uid);
        for (const friend of friends) {
            socket
                .to(friend.to == uid ? friend.from : friend.to)
                .emit('friend-offline', {
                    uid: uid,
                });
        }
    }
}