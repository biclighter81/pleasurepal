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
}
