import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { SchoolClass } from "./SchoolClass";

@Entity()
export class School {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  number!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  city?: string;

  @OneToMany(() => SchoolClass, (schoolClass) => schoolClass.school, {
    cascade: true,
  })
  classes!: SchoolClass[];
}
