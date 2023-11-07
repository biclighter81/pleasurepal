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
  from: string;
  @PrimaryColumn()
  to: string;
  @Column({ nullable: true })
  rejectedAt: Date;
  @Column({ nullable: true })
  acceptedAt: Date;
  @Column({ nullable: true })
  blockedAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
