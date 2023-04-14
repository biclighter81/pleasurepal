import { Entity, ManyToMany, ManyToOne, PrimaryColumn } from 'typeorm';
import { PleasureSession } from './pleasure-session.entity';

@Entity('deferred_discord_invite')
export class DeferredDiscordInvite {
  @PrimaryColumn()
  snowflake: string;
  @PrimaryColumn()
  sessionId: string;

  @ManyToOne(() => PleasureSession, (session) => session.deferredDiscordInvites)
  session: PleasureSession;
}
