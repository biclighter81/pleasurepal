import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { AuthGuard, AuthenticatedUser } from 'nest-keycloak-connect';
import { JWTKeycloakUser } from 'src/lib/interfaces/keycloak';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('self-command')
  @UseGuards(AuthGuard)
  async selfCommand(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body() body: any,
  ) {
    return await this.deviceService.selfCommand(user.sub, body);
  }

  @Post('self-random')
  @UseGuards(AuthGuard)
  async selfRandom(
    @AuthenticatedUser() user: JWTKeycloakUser,
    @Body() body: any,
  ) {
    let _running: boolean = false;
    const sessionDuration = body.duration || 100;
    const interval = setInterval(async () => {
      if (_running) return;
      _running = true;
      const duration = Math.floor(Math.random() * 5);
      const intensity = parseFloat(Math.random().toFixed(2));
      console.log('duration', duration, 'intensity', intensity);
      await this.deviceService.selfCommand(user.sub, { duration, intensity });
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));
      _running = false;
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
    }, sessionDuration * 1000);
  }
}
