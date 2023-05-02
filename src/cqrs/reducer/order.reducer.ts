import {
  IReducer,
  Order,
  OrderCreatedEvent,
  OrderEvents,
  OrderShippedEvent,
} from '../types';

export class OrderReducer implements IReducer<OrderEvents> {
  public eventHandlers = new Map<
    string,
    (event: OrderEvents, state: any) => Partial<Order>
  >();
  constructor() {
    this.eventHandlers.set('OrderShippedEvent', this.onOrderShippedEvent);
    this.eventHandlers.set('OrderCreatedEvent', this.onOrderCreatedEvent);
  }

  private onOrderShippedEvent(event: OrderShippedEvent, state: Partial<Order>) {
    console.log('OrderShippedEvent', event.payload, state, 'merge');
    return {
      ...state,
      status: 'shipped',
      shippingAddress: event.payload.shippingAddress,
    };
  }

  private onOrderCreatedEvent(event: OrderCreatedEvent, state: Partial<Order>) {
    console.log('OrderCreatedEvent', state, 'merge');
    return {
      id: event.id,
      status: 'created',
    };
  }
}
