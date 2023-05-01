import { Module } from '@nestjs/common';
import { CqrsController } from './cqrs.controller';
import { OrderAggregate } from './writeModel/example/order';
import { WriterService } from './writeModel/writer.service';

@Module({
  imports: [],
  controllers: [CqrsController],
  providers: [OrderAggregate, WriterService],
})
export class CqrsModule {}
