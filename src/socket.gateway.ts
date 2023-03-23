import { InjectRepository } from "@nestjs/typeorm";
import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { IsNull, Not, Repository } from "typeorm";
import { UserFriendshipRequest } from "./user/entities/user-friendship-request.entity";

@WebSocketGateway(80, {
    cors: {
        origin: '*',
    },
})
export class SocketGateway {
    @WebSocketServer()
    public server: Server;

    constructor(@InjectRepository(UserFriendshipRequest)
    private readonly userFriendshipRequestRepo: Repository<UserFriendshipRequest>) { }

    @SubscribeMessage('connect')
    async handleConnection(@ConnectedSocket() client: Socket) {
        const { sub } = client.handshake.auth;
        await client.join(sub);
        const friends = await this.getFriends(sub);
        await this.emitStatus('online', friends, sub);
    }

    @SubscribeMessage('disconnect')
    async handleDisconnect(@ConnectedSocket() client: Socket) {
        const { sub } = client.handshake.auth;
        const friends = await this.getFriends(sub);
        await this.emitStatus('offline', friends, sub);
    }

    async emitStatus(
        status: 'online' | 'offline',
        friends: UserFriendshipRequest[],
        sub: string,
    ) {
        if (friends.length) {
            for (const friend of friends) {
                this.server
                    .to(friend.to == sub ? friend.from : friend.to)
                    .emit(`friend-${status}`, {
                        uid: sub,
                    });
            }
            if (status == 'online') {
                this.server.to(
                    sub
                ).emit(
                    'online-friends',
                    friends.map((f) => (f.to == sub ? f.from : f.to)),
                );
            }
        }
    }

    async getFriends(sub: string) {
        const friends = await this.userFriendshipRequestRepo
            .createQueryBuilder()
            .where({
                from: sub,
                acceptedAt: Not(IsNull()),
            })
            .orWhere({
                to: sub,
                acceptedAt: Not(IsNull()),
            })
            .getMany();
        return friends;
    }
}