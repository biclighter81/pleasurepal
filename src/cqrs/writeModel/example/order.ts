import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  IAggregate,
  Order,
  OrderCreatedEvent,
  OrderEvents,
  OrderShippedEvent,
} from 'src/cqrs/types';
import { WriterService } from '../writer.service';
import { OrderReducer } from 'src/cqrs/reducer/order.reducer';

@Injectable()
export class OrderAggregate implements IAggregate<Order, OrderEvents> {
  name = 'example.order';
  reducer = new OrderReducer();

  constructor(
    private cmd: EventEmitter2,
    private readonly writer: WriterService,
  ) {}

  inistialState: Partial<Order> = {};

  async emit(event: OrderEvents) {
    this.writer.save(this.name, event);
  }

  @OnEvent('example.order.ship', {
    async: true,
  })
  async ship(payload: { id: string; shippingAddress: string }) {
    try {
      if (!payload.id) {
        throw new Error('Order id is required');
      }
      if (!payload.shippingAddress) {
        throw new Error('Shipping address is required');
      }

      const state = await this.writer.getState(
        this.name,
        payload.id,
        this.reducer,
      );
      if (!state) {
        throw new Error('Order not found');
      }

      this.cmd.emit('example.order.ship.success', {
        payload,
      });

      this.emit(
        new OrderShippedEvent(payload.id, {
          shippingAddress: payload.shippingAddress,
        }),
      );
    } catch (error) {
      console.log(error);
      this.cmd.emit('example.order.ship.error', error);
    }
  }

  @OnEvent('example.order.create', {
    async: true,
  })
  async create() {
    this.cmd.emit('example.order.create.success');
    this.emit(new OrderCreatedEvent());
  }
}
