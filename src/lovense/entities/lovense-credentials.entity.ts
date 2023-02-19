import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LovenseCredentials_PleasureSession } from './credentials_plesure_session.join-entity';
import { LovenseToy } from './lovense-toy.entity';

@Entity('lovense_credentials')
export class LovenseCredentials {
  @PrimaryColumn()
  uid: string;
  @Column()
  appVersion: string;
  @Column()
  wssPort: number;
  @Column()
  httpPort: number;
  @Column()
  wsPort: number;
  @Column()
  appType: string;
  @Column()
  domain: string;
  @Column()
  utoken: string;
  @Column()
  httpsPort: number;
  @Column()
  version: string;
  @Column()
  platform: string;
  @Column({ default: 'false' })
  unlinked: boolean;

  @ManyToMany(() => LovenseToy, (toy) => toy.credentials)
  @JoinTable()
  toys: LovenseToy[];

  @OneToMany(
    () => LovenseCredentials_PleasureSession,
    (join) => join.lovenseCredentials,
  )
  sessions: LovenseCredentials_PleasureSession[];

  @Column({ nullable: true })
  lastHeartbeat: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
