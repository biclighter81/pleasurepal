import { Module } from '@nestjs/common';
import { OrderQuery } from './order.query';
import { OrderListService } from './order.list';
import { WriterService } from 'src/cqrs/writeModel/writer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderList, OrderListSchema } from './order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderList.name, schema: OrderListSchema },
    ]),
  ],
  controllers: [OrderQuery],
  providers: [OrderListService, WriterService],
})
export class OrderListModule {}
