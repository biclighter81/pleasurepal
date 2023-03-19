import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFriendshipRequest } from './entities/user-friendship-request.entity';

@Injectable()
export class FriendService {
  private readonly logger: Logger = new Logger(FriendService.name);

  constructor(
    @InjectRepository(UserFriendshipRequest)
    private readonly userFriendshipRequestRepo: Repository<UserFriendshipRequest>,
  ) {}

  async requestFriendship(reqUid: string, uid: string) {
    return this.userFriendshipRequestRepo.save({
      requstUid: reqUid,
      uid: uid,
    });
  }
}
