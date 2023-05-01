import { randomUUID } from 'crypto';
import { extend } from 'dayjs';

export interface IAggregate<T, U extends IEvent> {
  name: string;
  inistialState: Partial<T>;
  emit: (event: U, payload: any) => void;
  reducer: IReducer<U>;
}

export interface IReducer<T> {
  eventHandlers: Map<string, (event: T, state: any) => Partial<Order>>;
}

export abstract class IEvent {
  name: string;
  id: string;
  uid: string;
  timestamp: number = Date.now();
}

export type OrderEvents = OrderCreatedEvent | OrderShippedEvent;

export class Order {
  id: string;
  status: string;
  items: string[];
  shippingAddress: string;
  billingAddress: string;
  paymentMethod: string;
}

export class OrderCreatedEvent extends IEvent {
  name = 'OrderCreatedEvent';
  constructor() {
    super();
    this.id = randomUUID();
  }
}

export class OrderShippedEvent extends IEvent {
  name = 'OrderShippedEvent';
  constructor(public id: string, public payload: { shippingAddress: string }) {
    super();
  }
}
