import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  @ManyToMany(() => LovenseToy, (toy) => toy.credentials)
  @JoinTable()
  toys: LovenseToy[];

  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
