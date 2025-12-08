import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  content!: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chatId" })
  chat!: Chat;

  @Column()
  chatId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  author!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
