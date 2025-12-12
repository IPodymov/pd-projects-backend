import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./Project";
import { School } from "./School";
import { SchoolClass } from "./SchoolClass";

export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  UNIVERSITY_STAFF = "university_staff",
  ADMIN = "admin",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role!: UserRole;

  @ManyToOne(() => School, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @Column()
  schoolId!: number;

  @ManyToOne(() => SchoolClass, {
    eager: true,
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "schoolClassId" })
  schoolClass?: SchoolClass;

  @Column({ nullable: true })
  schoolClassId?: number;

  @Column({ nullable: true })
  githubId?: string;

  @Column({ nullable: true })
  githubUsername?: string;

  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects!: Project[];

  @ManyToMany(() => Project, (project) => project.members)
  memberProjects!: Project[];
}
