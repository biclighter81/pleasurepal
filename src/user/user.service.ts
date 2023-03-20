import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { searchKCUser } from '../lib/keycloak';
import { User } from './entities/user.entity';
import { FriendService } from './friend.service';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);

  constructor(
    private readonly friendSrv: FriendService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

}
