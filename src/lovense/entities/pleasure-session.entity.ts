import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LovenseActionQueue } from './lovense-action-queue.entity';
import { User_PleasureSession } from './user_plesure_session.join-entity';

@Entity()
export class PleasureSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @OneToMany(() => LovenseActionQueue, (action) => action.session)
  actionQueue: LovenseActionQueue[];
}
