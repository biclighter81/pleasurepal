import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
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
