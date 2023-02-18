import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { LovenseDiscordSession } from './lovense-discord-session.entity';

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

  @ManyToOne(() => LovenseDiscordSession, (session) => session.actionQueue)
  @JoinColumn({ name: 'sessionId' })
  lovenseDiscordSession: LovenseDiscordSession;
}
