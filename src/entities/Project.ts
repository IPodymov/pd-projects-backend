import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { File } from "./File";

export enum ProjectStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column({
    type: "enum",
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status!: ProjectStatus;

  @Column({ nullable: true })
  githubUrl?: string;

  @Column({ nullable: true })
  schoolNumber?: string;

  @Column({ nullable: true })
  classNumber?: string;

  @ManyToOne(() => User, (user) => user.ownedProjects)
  owner!: User;

  @ManyToMany(() => User, (user) => user.memberProjects)
  members!: User[];

  @OneToMany(() => File, (file) => file.project)
  files!: File[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
