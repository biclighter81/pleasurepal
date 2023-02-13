import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);

  constructor() {}
}
