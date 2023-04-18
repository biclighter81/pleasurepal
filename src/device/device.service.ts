import { Injectable } from '@nestjs/common';
import { SocketGateway } from 'src/socket.gateway';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceInfo } from 'src/lib/interfaces/device';
import { createHash } from 'crypto';

@Injectable()
export class DeviceService {
  constructor(
    private readonly socketGateway: SocketGateway,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
  ) {}

  async selfCommand(
    uid: string,
    command: { duration: number; intensity: number },
  ) {
    this.socketGateway.server.to(uid).emit('device-vibrate', command);
    return command;
  }

  async vibrate(uid: string, duration: number, intensity: number) {
    this.socketGateway.server.to(uid).emit('device-vibrate', {
      duration,
      intensity: intensity / 100 || 1,
    });
  }

  async rotate(
    uid: string,
    duration: number,
    speed: number,
    clockwise?: boolean,
  ) {
    this.socketGateway.server.to(uid).emit('device-rotate', {
      duration,
      speed,
      clockwise,
    });
  }

  async linear(uid: string, duration: number, position: number) {
    this.socketGateway.server.to(uid).emit('device-linear', {
      duration,
      position,
    });
  }

  async scalar(
    uid: string,
    scalar: number,
    duration: number,
    actuatorType:
      | 'Constrict'
      | 'Inflate'
      | 'Oscillate'
      | 'Position'
      | 'Rotate'
      | 'Vibrate',
  ) {
    this.socketGateway.server.to(uid).emit('device-scalar', {
      scalar,
      actuatorType,
      duration,
    });
  }

  async stop(uid: string) {
    this.socketGateway.server.to(uid).emit('device-stop');
  }

  async onConnect(uid: string, info: DeviceInfo) {
    const hash = createHash('md5')
      .update(info.name + uid)
      .digest('hex');
    await this.deviceRepo.save({
      hash: hash,
      uid,
      deviceInfo: JSON.stringify(info),
      name: info.name,
    });
  }

  async onRemove(uid: string, info: DeviceInfo) {
    const hash = createHash('md5')
      .update(info.name + uid)
      .digest('hex');
    await this.deviceRepo.delete({ hash });
  }
}
