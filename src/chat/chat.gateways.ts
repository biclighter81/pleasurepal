import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConversationParticipants } from './entities/conversation-participants.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@WebSocketGateway(80, {
  cors: {
    origin:
      process.env.NODE_ENV == 'development' ? '*' : 'https://pleasurepal.de',
    credentials: process.env.NODE_ENV == 'development' ? false : true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  wss: Server;

  constructor(
    @InjectRepository(ConversationParticipants)
    private readonly participantsRepo: Repository<ConversationParticipants>,
  ) { }

  @SubscribeMessage('read')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string }
  ) {
    await this.participantsRepo.update({
      conversationId: body.conversationId,
      participantId: client.handshake.auth.sub,
    }, {
      lastReadAt: new Date(),
    })
  }
}
