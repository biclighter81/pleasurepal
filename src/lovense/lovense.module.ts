import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_PleasureSession } from './entities/credentials_plesure_session.join-entity';
import { LovenseActionQueue } from './entities/lovense-action-queue.entity';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { PleasureSession } from './entities/pleasure-session.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import { LovenseSessionService } from './lovense-session.service';
import { LovenseController } from './lovense.controller';
import { LovenseService } from './lovense.service';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseControlSservice } from './lovense-control.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      PleasureSession,
      LovenseCredentials_PleasureSession,
      LovenseActionQueue,
    ]),
    DiscordModule.forFeature(),
  ],
  controllers: [LovenseController],
  providers: [
    LovenseService,
    LovenseSessionService,
    LovenseControlSservice,
    DiscordService,
  ],
  exports: [],
})
export class LovenseModule {}
