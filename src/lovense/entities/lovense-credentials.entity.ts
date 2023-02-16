import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LovenseCredentials_DiscordSession } from './credentials_discord_session.join-entity';
import { LovenseDiscordSession } from './lovense-discord-session.entity';
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
    () => LovenseCredentials_DiscordSession,
    (join) => join.lovenseCredentials,
  )
  sessions: LovenseCredentials_DiscordSession[];

  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
