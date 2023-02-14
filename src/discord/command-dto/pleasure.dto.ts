import { Choice, Param, ParamType } from '@discord-nestjs/core';
import { ApplicationCommandOptionType } from 'discord.js';

export enum PleasureActionOptions {
  vibrate,
  rotate,
  pump,
  thrusting,
  fingering,
  suction,
}

export class PleasureCommandDto {
  @Param({ description: 'User 1', type: ParamType.USER, required: false })
  user: string;
  @Param({ description: 'User 2', type: ParamType.USER, required: false })
  user2: string;
  @Param({ description: 'User 3', type: ParamType.USER, required: false })
  user3: string;
  @Param({ description: 'User 4', type: ParamType.USER, required: false })
  user4: string;
  @Param({ description: 'User 5', type: ParamType.USER, required: false })
  user5: string;
  @Param({
    description: 'Channel session',
    type: ParamType.BOOLEAN,
    required: false,
  })
  channelsession: boolean;
  @Choice(PleasureActionOptions)
  @Param({ description: 'Action', type: ParamType.INTEGER, required: true })
  action: PleasureActionOptions;
  @Param({ description: 'Intensity', type: ParamType.INTEGER, required: false })
  intensity: number;
  @Param({
    description: 'Duration in seconds',
    type: ParamType.INTEGER,
    required: true,
  })
  duration: number;
  @Param({
    description: 'Loop time in seconds',
    type: ParamType.INTEGER,
    required: true,
  })
  looprunningsec: number;
  @Param({
    description: 'Pause time between loops in seconds',
    type: ParamType.INTEGER,
    required: true,
  })
  looppausesec: number;
}
