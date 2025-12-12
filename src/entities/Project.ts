import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  JoinTable,
} from "typeorm";
import { User } from "./User";
import { File } from "./File";
import { School } from "./School";
import { SchoolClass } from "./SchoolClass";

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

  @ManyToOne(() => School, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @Column()
  schoolId!: number;

  @ManyToOne(() => SchoolClass, { eager: true, nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "schoolClassId" })
  schoolClass?: SchoolClass;

  @Column({ nullable: true })
  schoolClassId?: number;

  @ManyToOne(() => User, (user) => user.ownedProjects)
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @Column()
  ownerId!: number;

  @ManyToMany(() => User, (user) => user.memberProjects)
  @JoinTable()
  members!: User[];

  @OneToMany(() => File, (file) => file.project)
  files!: File[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
