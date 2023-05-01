import { Module } from '@nestjs/common';
import { CqrsController } from './cqrs.controller';
import { OrderAggregate } from './writeModel/example/order';
import { WriterService } from './writeModel/writer.service';
import { OrderList } from './readModel/lists/order.list';
import { ReaderService } from './readModel/reader.service';

@Module({
  imports: [],
  controllers: [CqrsController],
  providers: [WriterService, ReaderService, OrderAggregate, OrderList],
})
export class CqrsModule {}
