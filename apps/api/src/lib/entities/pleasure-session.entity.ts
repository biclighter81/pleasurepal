import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActionQueue } from './action-queue.entity';
import { DeferredDiscordInvite } from './deferred-discord-invite.entity';
import { User_PleasureSession } from './user_plesure_session.entity';

@Entity()
export class PleasureSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  initiatorId: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isDiscord: boolean;

  @Generated('uuid')
  @Column()
  inviteToken: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
  @OneToMany(() => User_PleasureSession, (join) => join.pleasureSession, {
    cascade: true,
  })
  user: User_PleasureSession[];

  @OneToMany(() => ActionQueue, (action) => action.session)
  actionQueue: ActionQueue[];

  @OneToMany(() => DeferredDiscordInvite, (invite) => invite.session, {
    cascade: true,
  })
  deferredDiscordInvites: DeferredDiscordInvite[];
}
