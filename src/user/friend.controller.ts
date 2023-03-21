import { Body, Controller, Get, HttpException, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { FriendshipRequestAlreadyExistsError } from '../lib/errors/friend';
import { JWTKeycloakUser } from '../lib/interfaces/keycloak';
import { FriendService } from './friend.service';

@Controller('friends')
export class FriendController {
  constructor(private readonly friendServer: FriendService) { }

  @UseGuards(AuthGuard)
  @Post('request')
  async requestFriendship(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body('uid') uid: string,
  ) {
    try {
      return await this.friendServer.requestFriendship(user.sub, uid);
    } catch (e) {
      if (e instanceof FriendshipRequestAlreadyExistsError) {
        throw new HttpException({
          message: e.message,
          name: e.name,
        }, 400);
      }
    }
  }

  @UseGuards(AuthGuard)
  @Get('requests')
  async getFriendshipRequests(@AuthenticatedUser() user: JWTKeycloakUser) {
    return this.friendServer.getFriendshipRequests(user.sub);
  }

}
