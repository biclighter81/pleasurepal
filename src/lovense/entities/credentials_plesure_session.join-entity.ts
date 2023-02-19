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
import { PleasureSession } from './pleasure-session.entity';

@Entity('lovense_credentials_pleasure_session')
export class LovenseCredentials_PleasureSession {
  @PrimaryColumn()
  lovenseCredentialsUid: string;

  @ManyToOne(() => LovenseCredentials, (credentials) => credentials.sessions)
  @JoinColumn({ name: 'lovenseCredentialsUid' })
  lovenseCredentials: LovenseCredentials;

  @PrimaryColumn()
  pleasureSessionId: string;

  @ManyToOne(() => PleasureSession, (session) => session.credentials)
  @JoinColumn({ name: 'pleasureSessionId' })
  pleasureSession: PleasureSession;

  @Column({ default: false })
  inviteAccepted: boolean;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  hasControl: boolean;

  @Column({ nullable: true })
  lastActive: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
