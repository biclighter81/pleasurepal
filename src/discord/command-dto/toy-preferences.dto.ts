import { Choice, Param, ParamType } from '@discord-nestjs/core';

export class ToyPreferencesDto {
  @Param({ description: 'Toy nickname or name', type: ParamType.STRING })
  name: string;
}
