import { User } from 'src/user/entities/user.entity';
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

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'uid' })
  user: User;

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
