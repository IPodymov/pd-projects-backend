import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { StudentGroup } from '../../student-groups/entities/student-group.entity';

export enum InstitutionType {
  UNIVERSITY = 'UNIVERSITY',
  SCHOOL = 'SCHOOL',
}

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
  })
  type: InstitutionType;

  @OneToMany(() => StudentGroup, (group) => group.institution)
  groups: StudentGroup[];
}
