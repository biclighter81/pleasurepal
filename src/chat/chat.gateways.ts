import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

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
}
