import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { LovenseToy } from './lovense-toy.entity';

@Entity('lovense_heartbeat')
export class LovenseHeartbeat {
  @PrimaryColumn()
  uid: string;

  @Column()
  unlinked: boolean;

  @Column()
  lastHeartbeat: Date;

  @ManyToMany(() => LovenseToy, (toy) => toy.heartbeat)
  toys: LovenseToy[];
}
