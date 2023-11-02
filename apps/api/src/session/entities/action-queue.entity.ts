import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ActionQueue {
  @PrimaryColumn()
  sessionId: string;

  @PrimaryColumn()
  index: number;

  @Column({ type: 'json' })
  action: any;

  @Column({ nullable: true })
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => PleasureSession, (session) => session.actionQueue)
  @JoinColumn({ name: 'sessionId' })
  session: PleasureSession;
}
