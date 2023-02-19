import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PleasureSession } from './pleasure-session.entity';

@Entity()
export class LovenseActionQueue {
  @PrimaryColumn()
  sessionId: string;

  @PrimaryColumn()
  index: number;

  @Column({ type: 'json' })
  action: any;

  @Column({ nullable: true })
  startedAt: Date;

  @ManyToOne(() => PleasureSession, (session) => session.actionQueue)
  @JoinColumn({ name: 'sessionId' })
  session: PleasureSession;
}
