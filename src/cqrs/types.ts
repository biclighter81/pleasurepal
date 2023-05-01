import { randomUUID } from 'crypto';

export interface IAggregate<T, U extends IEvent> {
  name: string;
  inistialState: Partial<T>;
  emit: (event: U, payload: any) => void;
  getState: (id: string) => Promise<Partial<T>>;
}

export interface IEvent {
  name: string;
  id: string;
}

type OrderEvents = OrderCreatedEvent | OrderShippedEvent;

export class OrderReducer {
  public eventHandlers = new Map<
    string,
    (event: OrderEvents, state: any) => Partial<Order>
  >();
  constructor() {
    this.eventHandlers.set('OrderShippedEvent', this.onOrderShippedEvent);
    this.eventHandlers.set('OrderCreatedEvent', this.onOrderCreatedEvent);
  }

  private onOrderShippedEvent(event: OrderShippedEvent, state: any) {
    console.log('OrderShippedEvent', event.payload, state, 'merge');
    return {
      ...state,
      status: 'shipped',
      shippingAddress: event.payload.shippingAddress,
    };
  }

  private onOrderCreatedEvent(event: OrderCreatedEvent, state: any) {
    console.log('OrderCreatedEvent', state, 'merge');
    return {
      id: event.id,
      status: 'created',
    };
  }
}

export class Order {
  id: string;
  status: string;
  items: string[];
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: string;
}

export class OrderCreatedEvent implements IEvent {
  name = 'OrderCreatedEvent';
  id: string;
  constructor() {
    this.id = randomUUID();
  }
}

export class OrderShippedEvent implements IEvent {
  name = 'OrderShippedEvent';
  constructor(public id: string, public payload: { shippingAddress: string }) {}
}
