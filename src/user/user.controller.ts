import { Controller, Get, HttpException, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, AuthGuard, Resource, ResourceGuard } from 'nest-keycloak-connect';
import { JWTKeycloakUser } from '../lib/interfaces/keycloak';
import { searchKCUser } from '../lib/keycloak';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userSrv: UserService) { }

  @UseGuards(AuthGuard)
  @Get('search')
  async search(
    @Query('q') q: string,
  ) {
    if (!q) throw new HttpException('No query provided!', 400);
    try {
      return await searchKCUser(q)
    } catch (error) {
      console.log(error);
      throw new HttpException('Error searching for user!', 500);
    }
  }

}
