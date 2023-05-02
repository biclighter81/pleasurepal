import { Controller, Get, Param } from '@nestjs/common';
import { OrderListService } from './order.list';

@Controller('lists/order')
export class OrderQuery {
  constructor(private readonly orderList: OrderListService) {}

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.orderList.getOrderById(id);
  }
}
