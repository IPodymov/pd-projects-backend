import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectLink } from './project-link.entity';
import { ProjectHistory } from './project-history.entity';

export enum ProjectStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @ManyToOne(() => User, { nullable: false })
  author: User;

  @ManyToMany(() => User)
  @JoinTable()
  members: User[];

  @Column({ nullable: true })
  invitationToken: string;

  @OneToMany(() => ProjectLink, (link) => link.project, { cascade: true })
  links: ProjectLink[];

  @OneToMany(() => ProjectHistory, (history) => history.project)
  history: ProjectHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
