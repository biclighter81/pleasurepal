import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { LovenseCredentials } from './lovense-credentials.entity';

@Entity('lovense_toy')
export class LovenseToy {
  @PrimaryColumn()
  id: string;
  @Column()
  nickName: string;
  @Column()
  name: string;
  @Column()
  status: number;
  @ManyToMany(() => LovenseCredentials, (credentials) => credentials.toys)
  credentials: LovenseCredentials[];
}
