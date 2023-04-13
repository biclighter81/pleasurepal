import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PleasureSession } from './pleasure-session.entity';

@Entity('user_pleasure_session')
export class User_PleasureSession {
  @PrimaryColumn()
  uid: string;

  @PrimaryColumn()
  pleasureSessionId: string;

  @ManyToOne(() => PleasureSession, (session) => session.user)
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
