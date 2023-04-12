import { Injectable } from '@nestjs/common';
import { SocketGateway } from 'src/socket.gateway';

@Injectable()
export class DeviceService {
  constructor(private readonly socketGateway: SocketGateway) {}

  async selfCommand(
    uid: string,
    command: { duration: number; intensity: number },
  ) {
    this.socketGateway.server.to(uid).emit('device-command', command);
    return command;
  }
}
