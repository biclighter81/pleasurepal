import { genShortUUID } from 'src/lib/utils';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LovenseCredentials_DiscordSession } from './credentials_discord_session.join-entity';
import { LovenseActionQueue } from './lovense-action-queue.entity';
import { LovenseCredentials } from './lovense-credentials.entity';

@Entity()
export class LovenseDiscordSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  initiatorId: string;

  @Column({ default: true })
  active: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(
    () => LovenseCredentials_DiscordSession,
    (join) => join.lovenseDiscordSession,
    { cascade: true },
  )
  credentials: LovenseCredentials_DiscordSession[];

  @OneToMany(() => LovenseActionQueue, (action) => action.lovenseDiscordSession)
  actionQueue: LovenseActionQueue[];
}
