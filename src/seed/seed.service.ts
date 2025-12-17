import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import {
  Institution,
  InstitutionType,
} from '../institutions/entities/institution.entity';
import { StudentGroup } from '../student-groups/entities/student-group.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(StudentGroup)
    private studentGroupRepository: Repository<StudentGroup>,
    @InjectRepository(Project) private projectRepository: Repository<Project>,
  ) {}

  async seed() {
    await this.seedUsers();
    await this.seedInstitutionsAndGroups();
    await this.seedProjects();
  }

  private async seedUsers() {
    // Ensure roles exist or fetch them
    let adminRole = await this.roleRepository.findOne({
      where: { value: 'ADMIN' },
    });
    if (!adminRole) {
      adminRole = await this.roleRepository.save({
        value: 'ADMIN',
        description: 'Администратор',
      });
    }

    let staffRole = await this.roleRepository.findOne({
      where: { value: 'UNIVERSITY_STAFF' },
    });
    if (!staffRole) {
      staffRole = await this.roleRepository.save({
        value: 'UNIVERSITY_STAFF',
        description: 'Сотрудник вуза',
      });
    }

    let studentRole = await this.roleRepository.findOne({
      where: { value: 'STUDENT' },
    });
    if (!studentRole) {
      studentRole = await this.roleRepository.save({
        value: 'STUDENT',
        description: 'Учащийся',
      });
    }

    const password = await bcrypt.hash('password123', 5);

    // Admin
    const adminEmail = 'admin@example.com';
    let admin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });
    if (!admin) {
      admin = this.userRepository.create({
        email: adminEmail,
        password: password,
        firstName: 'Admin',
        lastName: 'User',
        roles: [adminRole],
      });
      await this.userRepository.save(admin);
      console.log('Seeded Admin user');
    }

    // Staff
    const staffEmail = 'staff@example.com';
    let staff = await this.userRepository.findOne({
      where: { email: staffEmail },
    });
    if (!staff) {
      staff = this.userRepository.create({
        email: staffEmail,
        password: password,
        firstName: 'Staff',
        lastName: 'User',
        roles: [staffRole],
      });
      await this.userRepository.save(staff);
      console.log('Seeded Staff user');
    }

    // Student
    const studentEmail = 'student@example.com';
    let student = await this.userRepository.findOne({
      where: { email: studentEmail },
    });
    if (!student) {
      student = this.userRepository.create({
        email: studentEmail,
        password: password,
        firstName: 'Student',
        lastName: 'User',
        roles: [studentRole],
      });
      await this.userRepository.save(student);
      console.log('Seeded Student user');
    }

    // School Student
    const schoolStudentEmail = 'school_student@example.com';
    let schoolStudent = await this.userRepository.findOne({
      where: { email: schoolStudentEmail },
    });
    if (!schoolStudent) {
      schoolStudent = this.userRepository.create({
        email: schoolStudentEmail,
        password: password,
        firstName: 'School',
        lastName: 'Student',
        roles: [studentRole],
      });
      await this.userRepository.save(schoolStudent);
      console.log('Seeded School Student user');
    }
  }

  private async seedInstitutionsAndGroups() {
    // University
    const uniName = 'Test University';
    let uni = await this.institutionRepository.findOne({
      where: { name: uniName },
    });
    if (!uni) {
      uni = this.institutionRepository.create({
        name: uniName,
        type: InstitutionType.UNIVERSITY,
      });
      await this.institutionRepository.save(uni);
      console.log('Seeded Institution (University)');
    }

    const groupName = 'Test Group 101';
    let group = await this.studentGroupRepository.findOne({
      where: { name: groupName },
    });
    if (!group) {
      group = this.studentGroupRepository.create({
        name: groupName,
        institution: uni,
        grade: 1, // University usually doesn't use grade 1-11 like schools, but let's keep it simple or null
      });
      await this.studentGroupRepository.save(group);
      console.log('Seeded Student Group (University)');
    }

    // School
    const schoolName = 'Test School';
    let school = await this.institutionRepository.findOne({
      where: { name: schoolName },
    });
    if (!school) {
      school = this.institutionRepository.create({
        name: schoolName,
        type: InstitutionType.SCHOOL,
      });
      await this.institutionRepository.save(school);
      console.log('Seeded Institution (School)');
    }

    const schoolGroupName = '9A';
    let schoolGroup = await this.studentGroupRepository.findOne({
      where: { name: schoolGroupName, institution: { id: school.id } },
    });
    if (!schoolGroup) {
      schoolGroup = this.studentGroupRepository.create({
        name: schoolGroupName,
        institution: school,
        grade: 9,
      });
      await this.studentGroupRepository.save(schoolGroup);
      console.log('Seeded Student Group (School)');
    }

    // Assign student to university group
    const student = await this.userRepository.findOne({
      where: { email: 'student@example.com' },
      relations: ['group'],
    });
    if (student && !student.group) {
      student.group = group;
      await this.userRepository.save(student);
      console.log('Assigned Student to University Group');
    }

    // Assign school student to school group
    const schoolStudent = await this.userRepository.findOne({
      where: { email: 'school_student@example.com' },
      relations: ['group'],
    });
    if (schoolStudent && !schoolStudent.group) {
      schoolStudent.group = schoolGroup;
      await this.userRepository.save(schoolStudent);
      console.log('Assigned School Student to School Group');
    }
  }

  private async seedProjects() {
    // University Student Projects
    const student = await this.userRepository.findOne({
      where: { email: 'student@example.com' },
      relations: ['group', 'group.institution'],
    });
    if (student) {
      const projectTitle = 'University Project 1';
      let project = await this.projectRepository.findOne({
        where: { title: projectTitle },
      });
      if (!project) {
        project = this.projectRepository.create({
          title: projectTitle,
          description: 'A project created by a university student.',
          status: ProjectStatus.APPROVED,
          author: student,
          links: [],
          institution: student.group?.institution,
        });
        await this.projectRepository.save(project);
        console.log('Seeded University Project');
      }
    }

    // School Student Projects
    const schoolStudent = await this.userRepository.findOne({
      where: { email: 'school_student@example.com' },
      relations: ['group', 'group.institution'],
    });
    if (schoolStudent) {
      const schoolProjectTitle = 'School Project 1';
      let schoolProject = await this.projectRepository.findOne({
        where: { title: schoolProjectTitle },
      });
      if (!schoolProject) {
        schoolProject = this.projectRepository.create({
          title: schoolProjectTitle,
          description: 'A project created by a school student.',
          status: ProjectStatus.APPROVED,
          author: schoolStudent,
          links: [],
          institution: schoolStudent.group?.institution,
        });
        await this.projectRepository.save(schoolProject);
        console.log('Seeded School Project');
      }
    }
  }
}
