import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('device')
export class Device {
  @PrimaryColumn()
  hash: string;

  @Column()
  uid: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  deviceInfo: string;

  @CreateDateColumn()
  addedAt: Date;
}
