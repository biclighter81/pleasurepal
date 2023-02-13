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
  @Param({ description: 'User 1', type: ParamType.USER, required: true })
  user: any[];
  @Param({ description: 'User 2', type: ParamType.USER, required: false })
  user2: any[];
  @Param({ description: 'User 3', type: ParamType.USER, required: false })
  user3: any[];
  @Param({ description: 'User 4', type: ParamType.USER, required: false })
  user4: any[];
  @Param({ description: 'User 5', type: ParamType.USER, required: false })
  user5: any[];
  @Param({ description: 'User 6', type: ParamType.USER, required: false })
  user6: any[];
  @Param({ description: 'User 7', type: ParamType.USER, required: false })
  user7: any[];
  @Param({ description: 'User 8', type: ParamType.USER, required: false })
  user8: any[];
  @Param({ description: 'User 9', type: ParamType.USER, required: false })
  user9: any[];
  @Param({ description: 'User 10', type: ParamType.USER, required: false })
  user10: any[];
  @Choice(PleasureActionOptions)
  @Param({ description: 'Action', type: ParamType.INTEGER })
  action: PleasureActionOptions;
}
