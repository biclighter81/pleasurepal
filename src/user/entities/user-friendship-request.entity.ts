import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserFriendshipRequest {
  @PrimaryColumn()
  requestUid: string;
  @PrimaryColumn()
  uid: string;
  @Column({ nullable: true })
  rejectedAt: Date;
  @Column({ nullable: true })
  acceptedAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
