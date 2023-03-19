import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity('lovense_toy')
export class LovenseToy {
  @PrimaryColumn()
  id: string;
  @Column()
  nickName: string;
  @Column()
  name: string;
  @Column()
  status: number;
  @ManyToMany(() => User, (user) => user.toys)
  user: User[];
}
