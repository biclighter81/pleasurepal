import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { LovenseHeartbeat } from './lovense-heartbeat.entity';

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
  @ManyToMany(() => LovenseHeartbeat, (heartbeat) => heartbeat.toys)
  heartbeat: LovenseHeartbeat[];
}
