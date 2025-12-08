import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { SchoolClass } from "./SchoolClass";
import { Message } from "./Message";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => SchoolClass, (schoolClass) => schoolClass.chats)
  @JoinColumn({ name: "schoolClassId" })
  schoolClass!: SchoolClass;

  @Column()
  schoolClassId!: number;

  @OneToMany(() => Message, (message) => message.chat, { cascade: true })
  messages!: Message[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
