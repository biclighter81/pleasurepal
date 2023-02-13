import { Choice, Param, ParamType } from '@discord-nestjs/core';

export enum RelinkOptions {
  yes,
  no,
}

export class LinkCommandDto {
  @Choice(RelinkOptions)
  @Param({ description: 'Force relink', type: ParamType.INTEGER })
  force: RelinkOptions;
}
