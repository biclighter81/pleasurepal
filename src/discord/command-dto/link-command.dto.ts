import { Choice, Param, ParamType } from '@discord-nestjs/core';

export class LinkCommandDto {
  @Param({ description: 'Force relink', type: ParamType.BOOLEAN })
  force: boolean;
}
