import { Entity, PrimaryColumn } from 'typeorm';

//preferences key - possible values - default value - description
@Entity()
export class UserPreferences {
  @PrimaryColumn()
  key: string;
}
