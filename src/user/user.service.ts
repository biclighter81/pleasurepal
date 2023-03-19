import { Injectable, Logger } from '@nestjs/common';
import { FriendService } from './friend.service';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);

  constructor(private readonly friendSrv: FriendService) {}
}
