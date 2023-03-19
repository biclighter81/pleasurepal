import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseActionQueue } from './entities/lovense-action-queue.entity';
import { PleasureSession } from './entities/pleasure-session.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import { LovenseSessionService } from './lovense-session.service';
import { LovenseController } from './lovense.controller';
import { LovenseService } from './lovense.service';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseControlSservice } from './lovense-control.service';
import { User } from 'src/user/entities/user.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LovenseToy,
      PleasureSession,
      User_PleasureSession,
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
