import { Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipController } from './membership.controller';

@Module({
  providers: [MembershipService],
  controllers: [MembershipController]
})
export class MembershipModule {}
