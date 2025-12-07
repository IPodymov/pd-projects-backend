import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Project } from "./Project";

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

  @Column()
  schoolNumber!: string;

  @Column({ nullable: true })
  classNumber?: string;
  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects!: Project[];

  @ManyToMany(() => Project, (project) => project.members)
  @JoinTable()
  memberProjects!: Project[];
}
