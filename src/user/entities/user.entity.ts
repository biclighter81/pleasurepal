import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { User_PleasureSession } from 'src/lovense/entities/user_plesure_session.join-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryColumn()
  uid: string;
  @Column({ nullable: true })
  appVersion: string;
  @Column({ nullable: true })
  wssPort: number;
  @Column({ nullable: true })
  httpPort: number;
  @Column({ nullable: true })
  wsPort: number;
  @Column({ nullable: true })
  appType: string;
  @Column({ nullable: true })
  domain: string;
  @Column({ nullable: true })
  utoken: string;
  @Column({ nullable: true })
  httpsPort: number;
  @Column({ nullable: true })
  version: string;
  @Column({ nullable: true })
  platform: string;
  @Column({ default: 'false' })
  unlinked: boolean;

  @ManyToMany(() => LovenseToy, (toy) => toy.user)
  @JoinTable()
  toys: LovenseToy[];

  @ManyToMany(() => User, (user) => user.friends)
  @JoinTable()
  friends: User[];

  @OneToMany(() => User_PleasureSession, (join) => join.user)
  sessions: User_PleasureSession[];

  @Column({ nullable: true })
  lastHeartbeat: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @CreateDateColumn()
  createdAt: Date;
}
