import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class UserFriendshipRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  requstUid: string;
  @Column()
  uid: string;
  @Column({ default: false })
  accepted: boolean;
  @Column({ nullable: true })
  acceptedAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
