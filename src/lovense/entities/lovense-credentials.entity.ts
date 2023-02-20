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
  @Column({ nullable: true })
  appVersion: string;
  @Column({ nullable: true })
  wssPort: number;
  @Column({ nullable: true })
  httpPort: number;
  @Column({ nullable: true })
  wsPort: number;
  @Column({ nullable: true })
  appType: string;
  @Column({ nullable: true })
  domain: string;
  @Column({ nullable: true })
  utoken: string;
  @Column({ nullable: true })
  httpsPort: number;
  @Column({ nullable: true })
  version: string;
  @Column({ nullable: true })
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
