import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import {
  FriendshipAlreadyExists,
  FriendshipRequestAlreadyExists,
  FriendshipRequestBlocked,
  FriendshipRequestNotFound,
} from '../lib/errors/friend';
import { JWTKeycloakUser } from '../lib/interfaces/keycloak';
import { FriendService } from './friend.service';

@Controller('friends')
export class FriendController {
  constructor(private readonly friendServer: FriendService) {}

  @UseGuards(AuthGuard)
  @Post('request')
  async requestFriendship(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body('uid') uid: string,
  ) {
    try {
      return await this.friendServer.requestFriendship(user.sub, uid);
    } catch (e) {
      if (
        e instanceof FriendshipAlreadyExists ||
        e instanceof FriendshipRequestAlreadyExists ||
        e instanceof FriendshipRequestBlocked ||
        e instanceof FriendshipAlreadyExists
      ) {
        throw new HttpException(
          {
            message: e.message,
            name: e.name,
          },
          400,
        );
      }
      throw new HttpException('Something went wrong', 500);
    }
  }

  @UseGuards(AuthGuard)
  @Get('')
  async getFriends(@AuthenticatedUser() user: JWTKeycloakUser) {
    return this.friendServer.getFriends(user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('requests')
  async getFriendshipRequests(@AuthenticatedUser() user: JWTKeycloakUser) {
    return this.friendServer.getPending(user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('accept')
  async acceptFriendshipRequest(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body('uid') uid: string,
  ) {
    if (!uid) {
      throw new HttpException('Missing uid in body', 400);
    }
    try {
      return await this.friendServer.accept(uid, user.sub);
    } catch (e) {
      if (e instanceof FriendshipRequestNotFound) {
        throw new HttpException(
          {
            message: e.message,
            name: e.name,
          },
          400,
        );
      }
      throw new HttpException('Something went wrong', 500);
    }
  }

  @UseGuards(AuthGuard)
  @Post('reject')
  async rejectFriendshipRequest(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body('uid') uid: string,
  ) {
    if (!uid) {
      throw new HttpException('Missing uid in body', 400);
    }
    try {
      return await this.friendServer.reject(uid, user.sub);
    } catch (e) {
      if (e instanceof FriendshipRequestNotFound) {
        throw new HttpException(
          {
            message: e.message,
            name: e.name,
          },
          400,
        );
      }
      throw new HttpException('Something went wrong', 500);
    }
  }
}
