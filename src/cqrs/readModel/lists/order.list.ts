import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OrderCreatedEvent, OrderShippedEvent } from 'src/cqrs/types';

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV == 'development' ? '*' : 'https://pleasurepal.de',
    credentials: process.env.NODE_ENV == 'development' ? false : true,
  },
})
export class OrderList {
  @WebSocketServer()
  wss: Server;

  @OnEvent('OrderCreatedEvent')
  async handleOrderCreatedEvent(event: OrderCreatedEvent) {
    console.log('OrderCreatedEvent readModel', event);
  }

  @OnEvent('OrderShippedEvent')
  async handleOrderShippedEvent(event: OrderShippedEvent) {
    console.log('OrderShippedEvent readModel', event);
  }
}
