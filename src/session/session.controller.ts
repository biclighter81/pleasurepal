import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedUser, AuthGuard } from 'nest-keycloak-connect';
import { NoSessionFoundError } from 'src/lib/errors/session';
import { JWTKeycloakUser, KeycloakUser } from 'src/lib/interfaces/keycloak';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionSrv: SessionService) {}

  @UseGuards(AuthGuard)
  @Get('invites')
  async getInvites(@AuthenticatedUser() user: JWTKeycloakUser) {
    return this.sessionSrv.getInvites(user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('invite/accept/:sessionId')
  @HttpCode(200)
  async acceptInvite(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Param('sessionId') sessionId: string,
  ) {
    try {
      await this.sessionSrv.acceptInvite(sessionId, user.sub);
      return { sessionId };
    } catch (e) {
      if (e instanceof NoSessionFoundError) {
        throw new HttpException(
          {
            message: e.message,
            name: e.name,
          },
          404,
        );
      }
      console.log(e);
      throw new HttpException('Error accepting invite!', 500);
    }
  }

  @UseGuards(AuthGuard)
  @Post('invite/decline/:sessionId')
  @HttpCode(200)
  async declineInvite(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Param('sessionId') sessionId: string,
  ) {
    try {
      await this.sessionSrv.declineInvite(sessionId, user.sub);
      return { sessionId };
    } catch (e) {
      if (e instanceof NoSessionFoundError) {
        throw new HttpException(
          {
            message: e.message,
            name: e.name,
          },
          404,
        );
      }
      console.log(e);
      throw new HttpException('Error accepting invite!', 500);
    }
  }

  @UseGuards(AuthGuard)
  @Get('current')
  async getCurrentSession(@AuthenticatedUser() user: JWTKeycloakUser) {}

  @UseGuards(AuthGuard)
  @Get('/')
  async getSessions(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Query() query: any,
  ) {
    const { offset = 0, q } = query;
    if (q) return this.sessionSrv.searchSessions(user.sub, q, offset);
    return this.sessionSrv.getSessions(user.sub, offset);
  }

  @UseGuards(AuthGuard)
  @Post('/')
  async createSession(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body() body: any,
  ) {
    const uids: string[] = body.uids;
    const name = body.name;
    try {
      if (!uids || !uids.length)
        throw new HttpException('No uids provided!', 400);
      const session = await this.sessionSrv.create(user.sub, uids, name);
      await Promise.all(
        uids.map((uid) =>
          this.sessionSrv.sendInvite(session.id, uid, user.sub),
        ),
      );
      return session;
    } catch (e) {
      console.log(e);
      throw new HttpException('Error creating session!', 500);
    }
  }
}
