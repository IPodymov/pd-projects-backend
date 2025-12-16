import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectLink } from './entities/project-link.entity';
import { ProjectHistory } from './entities/project-history.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(ProjectLink)
    private projectLinkRepository: Repository<ProjectLink>,
    @InjectRepository(ProjectHistory)
    private projectHistoryRepository: Repository<ProjectHistory>,
    private usersService: UsersService,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: User) {
    // Check if student is allowed to create project (Grade >= 7)
    const isStudent = user.roles.some((role) => role.value === 'STUDENT');
    if (isStudent) {
      const fullUser = await this.usersService.getProfile(user.id);
      if (fullUser && fullUser.group) {
        if (fullUser.group.grade && fullUser.group.grade < 7) {
          throw new ForbiddenException(
            'Projects are only allowed from 7th grade',
          );
        }
      } else {
        // If no group assigned, maybe allow or block?
        // "Projects are carried out from the 7th grade" implies school context.
        // If no group, maybe they are not in school yet or data missing.
        // Let's assume if no group, they can't create if we strictly enforce school context.
        // But maybe they are university students?
        // University students might not have "grade" or grade > 11.
        // Let's assume if grade is present, check it.
      }
    }

    const project = new Project();
    project.title = createProjectDto.title;
    project.description = createProjectDto.description;
    project.author = user;

    const isStaffOrAdmin = user.roles.some((role) =>
      ['ADMIN', 'UNIVERSITY_STAFF'].includes(role.value),
    );
    project.status = isStaffOrAdmin
      ? ProjectStatus.APPROVED
      : ProjectStatus.PENDING;

    project.links = createProjectDto.links.map((linkDto) => {
      const link = new ProjectLink();
      link.url = linkDto.url;
      link.description = linkDto.description;
      return link;
    });

    return await this.projectRepository.save(project);
  }

  async findAll(user?: User) {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.links', 'links')
      .leftJoinAndSelect('project.author', 'author')
      .leftJoinAndSelect('author.group', 'authorGroup')
      .leftJoinAndSelect('authorGroup.institution', 'authorInstitution')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('project.history', 'history');

    if (user) {
      const isAdminOrStaff = user.roles.some((role) =>
        ['ADMIN', 'UNIVERSITY_STAFF'].includes(role.value),
      );
      if (!isAdminOrStaff) {
        // Fetch full user details to get group
        const fullUser = await this.usersService.getProfile(user.id);

        // Base condition: APPROVED or Own (author/member)
        let whereCondition =
          '(project.status = :approvedStatus) OR (project.author.id = :userId) OR (:userId IN (SELECT "userId" FROM "projects_members_users" WHERE "projectId" = project.id))';
        let parameters: Record<string, any> = {
          approvedStatus: ProjectStatus.APPROVED,
          userId: user.id,
        };

        // If user has a group (and thus institution), filter APPROVED projects by institution
        if (fullUser && fullUser.group && fullUser.group.institution) {
          // We want to show APPROVED projects ONLY from the same institution
          // OR own projects (regardless of institution)

          // So: (APPROVED AND same_institution) OR Own

          whereCondition =
            '((project.status = :approvedStatus AND authorInstitution.id = :institutionId) OR (project.author.id = :userId) OR (:userId IN (SELECT "userId" FROM "projects_members_users" WHERE "projectId" = project.id)))';
          parameters = {
            ...parameters,
            institutionId: fullUser.group.institution.id,
          };
        }

        query.where(whereCondition, parameters);
      }
    } else {
      // Public (unauthenticated): only APPROVED
      query.where('project.status = :status', {
        status: ProjectStatus.APPROVED,
      });
    }

    return await query.getMany();
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['links', 'author', 'history', 'members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async generateInvitation(id: number, user: User) {
    const project = await this.findOne(id);
    if (project.author.id !== user.id) {
      throw new ForbiddenException('Only author can generate invitation');
    }
    const token = uuidv4();
    project.invitationToken = token;
    await this.projectRepository.save(project);
    return { token };
  }

  async joinProject(token: string, user: User) {
    const project = await this.projectRepository.findOne({
      where: { invitationToken: token },
      relations: ['members', 'author'],
    });
    if (!project) {
      throw new NotFoundException('Invalid invitation token');
    }

    // Check if already member
    if (
      project.members.some((m) => m.id === user.id) ||
      project.author.id === user.id
    ) {
      throw new BadRequestException('User is already a member of this project');
    }

    project.members.push(user);
    await this.projectRepository.save(project);
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, user: User) {
    const project = await this.findOne(id);

    // Track history
    const history = new ProjectHistory();
    history.project = project;
    history.changedBy = user;
    history.changes = updateProjectDto;
    await this.projectHistoryRepository.save(history);

    // Update fields
    if (updateProjectDto.title) project.title = updateProjectDto.title;
    if (updateProjectDto.description)
      project.description = updateProjectDto.description;
    if (updateProjectDto.status) project.status = updateProjectDto.status;

    // Update links if provided (replace strategy for simplicity, or append? Requirement says "update project". Usually implies replacing the list or specific operations. Let's replace for now as it's easier to manage via DTO)
    if (updateProjectDto.links) {
      // Remove old links? Or just add new ones?
      // If we want to support editing existing links, we need IDs in DTO.
      // Given the simple DTO, let's assume we replace the links.
      await this.projectLinkRepository.delete({ project: { id: project.id } });
      project.links = updateProjectDto.links.map((linkDto) => {
        const link = new ProjectLink();
        link.url = linkDto.url;
        link.description = linkDto.description;
        return link;
      });
    }

    return await this.projectRepository.save(project);
  }

  async remove(id: number) {
    const project = await this.findOne(id);
    return await this.projectRepository.remove(project);
  }
}
