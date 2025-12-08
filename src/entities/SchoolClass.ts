import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { School } from "./School";
import { Chat } from "./Chat";

@Entity()
export class SchoolClass {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => School, (school) => school.classes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "schoolId" })
  school!: School;

  @Column()
  schoolId!: number;

  @OneToMany(() => Chat, (chat) => chat.schoolClass, { cascade: true })
  chats!: Chat[];
}
