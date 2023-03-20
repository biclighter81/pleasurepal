import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
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
    return this.friendServer.requestFriendship(user.sub, uid);
  }

}
