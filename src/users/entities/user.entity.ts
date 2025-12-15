import {Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Role} from "../../roles/entities/role.entity";
import {Project} from "../../projects/entities/project.entity";
import {StudentGroup} from "../../student-groups/entities/student-group.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true, nullable: false})
    email: string;

    @Column({nullable: false})
    password: string;

    @Column({nullable: true})
    firstName: string;

    @Column({nullable: true})
    lastName: string;

    @Column({nullable: true})
    middleName: string;

    @Column({nullable: true, type: 'varchar'})
    resetPasswordToken: string | null;

    @Column({nullable: true, type: 'timestamp'}) // Using timestamp for expiration
    resetPasswordExpires: Date | null;

    @Column({default: false})
    banned: boolean;

    @Column({nullable: true})
    banReason: string;

    @ManyToMany(() => Role)
    @JoinTable()
    roles: Role[];

    @OneToMany(() => Project, (project) => project.author)
    projects: Project[];

    @ManyToOne(() => StudentGroup, (group) => group.students, {nullable: true})
    group: StudentGroup;
}
