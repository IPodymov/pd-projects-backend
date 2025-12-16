import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Institution } from '../../institutions/entities/institution.entity';
import { User } from '../../users/entities/user.entity';

@Entity('student_groups')
export class StudentGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  grade: number;

  @ManyToOne(() => Institution, (institution) => institution.groups, {
    onDelete: 'CASCADE',
  })
  institution: Institution;

  @OneToMany(() => User, (user) => user.group)
  students: User[];
}
