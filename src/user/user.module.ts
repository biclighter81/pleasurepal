import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFriendshipRequest } from './entities/user-friendship-request.entity';
import { FriendService } from './friend.service';
import { FriendSocketGateway } from './friend.socket-gateway';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserFriendshipRequest])],
  controllers: [UserController],
  providers: [UserService, FriendService, FriendSocketGateway],
})
export class UserModule {}
