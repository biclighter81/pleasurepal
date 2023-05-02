import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OrderCreatedEvent, OrderShippedEvent } from 'src/cqrs/types';
import { OrderList } from './order.schema';
import { Model } from 'mongoose';

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV == 'development' ? '*' : 'https://pleasurepal.de',
    credentials: process.env.NODE_ENV == 'development' ? false : true,
  },
})
export class OrderListService {
  constructor(
    @InjectModel(OrderList.name)
    private readonly orderListModel: Model<OrderList>,
  ) {}

  @WebSocketServer()
  wss: Server;

  @OnEvent('OrderCreatedEvent')
  async handleOrderCreatedEvent(event: OrderCreatedEvent) {
    console.log('OrderCreatedEvent readModel', event);
    const order = new this.orderListModel({
      _id: event.id,
      updatedAt: event.timestamp,
    });
    await order.save();
  }

  @OnEvent('OrderShippedEvent')
  async handleOrderShippedEvent(event: OrderShippedEvent) {
    console.log('OrderShippedEvent readModel', event);
    await this.orderListModel.updateOne(
      { _id: event.id },
      {
        $set: {
          status: 'shipped',
          shippingAddress: event.payload.shippingAddress,
          updatedAt: event.timestamp,
        },
      },
    );
  }

  async getOrderById(id: string) {
    return await this.orderListModel.findOne({ _id: id });
  }
}
