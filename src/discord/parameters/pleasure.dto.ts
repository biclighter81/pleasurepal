import { Choice, Param, ParamType } from '@discord-nestjs/core';

export enum PleasureActionOptions {
  vibrate,
  rotate,
  pump,
  thrusting,
  fingering,
  suction,
}

export class PleasureCommandDto {
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
