import {
  Controller,
  Get,
  HttpException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'nest-keycloak-connect';
import { searchKCUser } from '../lib/keycloak';

@Controller('user')
export class UserController {
  constructor() {}

  @UseGuards(AuthGuard)
  @Get('search')
  async search(@Query('q') q: string) {
    if (!q) throw new HttpException('No query provided!', 400);
    try {
      return await searchKCUser(q);
    } catch (error) {
      console.log(error);
      throw new HttpException('Error searching for user!', 500);
    }
  }

  @Get('me')
  async me() {
    throw new Error('test');
  }
}
