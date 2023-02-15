import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LovenseCredentials } from './lovense-credentials.entity';
import { LovenseDiscordSession } from './lovense-discord-session.entity';

@Entity('lovense_credentials_lovense_discord_session')
export class LovenseCredentials_DiscordSession {
  @PrimaryColumn()
  lovenseCredentialsUid: string;

  @ManyToOne(() => LovenseCredentials, (credentials) => credentials.sessions)
  @JoinColumn({ name: 'lovenseCredentialsUid' })
  lovenseCredentials: LovenseCredentials;

  @PrimaryColumn()
  lovenseDiscordSessionId: string;

  @ManyToOne(() => LovenseDiscordSession, (session) => session.credentials)
  @JoinColumn({ name: 'lovenseDiscordSessionId' })
  lovenseDiscordSession: LovenseDiscordSession;

  @Column({ default: false })
  inviteAccepted: boolean;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  lastActive: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
