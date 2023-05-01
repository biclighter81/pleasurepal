import { Module } from '@nestjs/common';
import { CqrsController } from './cqrs.controller';
import { OrderAggregate } from './writeModel/example/order';
import { WriterService } from './writeModel/writer.service';
import { OrderList } from './readModel/lists/order.list';

@Module({
  imports: [],
  controllers: [CqrsController],
  providers: [OrderAggregate, WriterService, OrderList],
})
export class CqrsModule {}
