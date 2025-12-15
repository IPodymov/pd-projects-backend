import {Injectable, OnModuleInit} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {User} from '../users/entities/user.entity';
import {Role} from '../roles/entities/role.entity';
import {Institution, InstitutionType} from '../institutions/entities/institution.entity';
import {StudentGroup} from '../student-groups/entities/student-group.entity';
import {Project, ProjectStatus} from '../projects/entities/project.entity';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Role) private roleRepository: Repository<Role>,
        @InjectRepository(Institution) private institutionRepository: Repository<Institution>,
        @InjectRepository(StudentGroup) private studentGroupRepository: Repository<StudentGroup>,
        @InjectRepository(Project) private projectRepository: Repository<Project>,
    ) {
    }

    async onModuleInit() {
        await this.seedUsers();
        await this.seedInstitutionsAndGroups();
        await this.seedProjects();
    }

    private async seedUsers() {
        // Ensure roles exist or fetch them
        let adminRole = await this.roleRepository.findOne({where: {value: 'ADMIN'}});
        if (!adminRole) {
            adminRole = await this.roleRepository.save({value: 'ADMIN', description: 'Администратор'});
        }

        let staffRole = await this.roleRepository.findOne({where: {value: 'UNIVERSITY_STAFF'}});
        if (!staffRole) {
            staffRole = await this.roleRepository.save({value: 'UNIVERSITY_STAFF', description: 'Сотрудник вуза'});
        }

        let studentRole = await this.roleRepository.findOne({where: {value: 'STUDENT'}});
        if (!studentRole) {
            studentRole = await this.roleRepository.save({value: 'STUDENT', description: 'Учащийся'});
        }

        const password = await bcrypt.hash('password123', 5);

        // Admin
        const adminEmail = 'admin@example.com';
        let admin = await this.userRepository.findOne({where: {email: adminEmail}});
        if (!admin) {
            admin = this.userRepository.create({
                email: adminEmail,
                password: password,
                firstName: 'Admin',
                lastName: 'User',
                roles: [adminRole]
            });
            await this.userRepository.save(admin);
            console.log('Seeded Admin user');
        }

        // Staff
        const staffEmail = 'staff@example.com';
        let staff = await this.userRepository.findOne({where: {email: staffEmail}});
        if (!staff) {
            staff = this.userRepository.create({
                email: staffEmail,
                password: password,
                firstName: 'Staff',
                lastName: 'User',
                roles: [staffRole]
            });
            await this.userRepository.save(staff);
            console.log('Seeded Staff user');
        }

        // Student
        const studentEmail = 'student@example.com';
        let student = await this.userRepository.findOne({where: {email: studentEmail}});
        if (!student) {
            student = this.userRepository.create({
                email: studentEmail,
                password: password,
                firstName: 'Student',
                lastName: 'User',
                roles: [studentRole]
            });
            await this.userRepository.save(student);
            console.log('Seeded Student user');
        }
    }

    private async seedInstitutionsAndGroups() {
        const uniName = 'Test University';
        let uni = await this.institutionRepository.findOne({where: {name: uniName}});
        if (!uni) {
            uni = this.institutionRepository.create({
                name: uniName,
                type: InstitutionType.UNIVERSITY
            });
            await this.institutionRepository.save(uni);
            console.log('Seeded Institution');
        }

        const groupName = 'Test Group 101';
        let group = await this.studentGroupRepository.findOne({where: {name: groupName}});
        if (!group) {
            group = this.studentGroupRepository.create({
                name: groupName,
                institution: uni
            });
            await this.studentGroupRepository.save(group);
            console.log('Seeded Student Group');
        }

        // Assign student to group
        const student = await this.userRepository.findOne({
            where: {email: 'student@example.com'},
            relations: ['group']
        });
        if (student && !student.group) {
            student.group = group;
            await this.userRepository.save(student);
            console.log('Assigned Student to Group');
        }
    }

    private async seedProjects() {
        const student = await this.userRepository.findOne({where: {email: 'student@example.com'}});
        if (!student) return;

        const projectTitle = 'Student Project 1';
        let project = await this.projectRepository.findOne({where: {title: projectTitle}});
        if (!project) {
            project = this.projectRepository.create({
                title: projectTitle,
                description: 'A project created by a student, pending moderation.',
                status: ProjectStatus.PENDING,
                author: student,
                links: []
            });
            await this.projectRepository.save(project);
            console.log('Seeded Pending Project');
        }

        const approvedProjectTitle = 'Approved Project';
        let approvedProject = await this.projectRepository.findOne({where: {title: approvedProjectTitle}});
        if (!approvedProject) {
            approvedProject = this.projectRepository.create({
                title: approvedProjectTitle,
                description: 'An approved project.',
                status: ProjectStatus.APPROVED,
                author: student,
                links: []
            });
            await this.projectRepository.save(approvedProject);
            console.log('Seeded Approved Project');
        }
    }
}
