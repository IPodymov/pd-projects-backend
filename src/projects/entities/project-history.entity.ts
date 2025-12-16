import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';

@Entity('project_history')
export class ProjectHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.history, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @ManyToOne(() => User)
  changedBy: User;

  @Column('jsonb', { nullable: true }) // Using jsonb for postgres
  changes: any;

  @CreateDateColumn()
  createdAt: Date;
}
