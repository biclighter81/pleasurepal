import { Module } from '@nestjs/common';
import { CqrsController } from './cqrs.controller';
import { OrderAggregate } from './writeModel/example/order';
import { WriterService } from './writeModel/writer.service';
import { ReaderService } from './readModel/reader.service';
import { OrderListModule } from './readModel/lists/order/order.module';

@Module({
  imports: [OrderListModule],
  controllers: [CqrsController],
  providers: [WriterService, ReaderService, OrderAggregate],
})
export class CqrsModule {}
