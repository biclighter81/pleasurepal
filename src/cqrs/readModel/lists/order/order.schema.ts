import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderListDocument = HydratedDocument<OrderList>;

@Schema()
export class OrderList {
  @Prop()
  status: string;

  @Prop()
  shippingAddress: string;

  @Prop()
  total: number;

  @Prop()
  updatedAt: Date;
}

export const OrderListSchema = SchemaFactory.createForClass(OrderList);
