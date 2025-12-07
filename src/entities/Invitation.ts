import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { UserRole } from "./User";

@Entity()
export class Invitation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    token!: string;

    @Column()
    schoolNumber!: string;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.TEACHER
    })
    role!: UserRole;

    @Column()
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
