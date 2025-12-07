import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Project } from "./Project";

export enum FileType {
    DOCUMENT = "document",
    PRESENTATION = "presentation"
}

@Entity()
export class File {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    filename!: string;

    @Column()
    path!: string;

    @Column({
        type: "enum",
        enum: FileType
    })
    type!: FileType;

    @ManyToOne(() => Project, (project) => project.files, { onDelete: "CASCADE" })
    project!: Project;
}
