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
import { InstitutionType } from '../institutions/entities/institution.entity';

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
    const fullUser = await this.usersService.getProfile(user.id);

    // Check if student is allowed to create project (Grade >= 7)
    const isStudent = user.roles.some((role) => role.value === 'STUDENT');
    if (isStudent) {
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

    if (fullUser?.group?.institution) {
      project.institution = fullUser.group.institution;
    }

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

  async findAll(user?: User, search?: string, institutionId?: number) {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.links', 'links')
      .leftJoinAndSelect('project.author', 'author')
      .leftJoinAndSelect('project.institution', 'institution')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('project.history', 'history');

    // Поиск по названию
    if (search) {
      query.andWhere('LOWER(project.title) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (user) {
      const isAdminOrStaff = user.roles.some((role) =>
        ['ADMIN', 'UNIVERSITY_STAFF'].includes(role.value),
      );
      
      if (isAdminOrStaff) {
        // Админы и сотрудники вуза видят все проекты
        // Но могут фильтровать по учебному заведению
        if (institutionId) {
          query.andWhere('institution.id = :institutionId', { institutionId });
        }
      } else {
        // Обычные пользователи (студенты)
        const fullUser = await this.usersService.getProfile(user.id);

        const conditions: string[] = [];
        const parameters: Record<string, any> = {
          userId: user.id,
          approvedStatus: ProjectStatus.APPROVED,
        };

        // Пользователь видит:
        // 1. Свои проекты (независимо от статуса и учреждения)
        conditions.push('project.author.id = :userId');

        // 2. Проекты, где он является участником
        conditions.push(
          '(:userId IN (SELECT "userId" FROM "projects_members_users" WHERE "projectId" = project.id))',
        );

        // 3. Одобренные проекты
        if (institutionId) {
          // Если указан institutionId, показываем одобренные проекты только этого учреждения
          conditions.push(
            '(project.status = :approvedStatus AND institution.id = :institutionId)',
          );
          parameters.institutionId = institutionId;
        } else if (fullUser?.group?.institution) {
          // Если у пользователя есть группа и учреждение, показываем одобренные проекты его учреждения
          conditions.push(
            '(project.status = :approvedStatus AND institution.id = :userInstitutionId)',
          );
          parameters.userInstitutionId = fullUser.group.institution.id;
        } else {
          // Если нет группы или учреждения, показываем все одобренные проекты
          conditions.push('project.status = :approvedStatus');
        }

        query.andWhere(`(${conditions.join(' OR ')})`, parameters);
      }
    } else {
      // Публичный доступ (неавторизованные): только одобренные проекты
      query.andWhere('project.status = :status', {
        status: ProjectStatus.APPROVED,
      });
      
      // Фильтрация по учебному заведению для неавторизованных
      if (institutionId) {
        query.andWhere('institution.id = :institutionId', { institutionId });
      }
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
      relations: ['members', 'author', 'institution'],
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

    // Check limits based on institution type
    const institutionType = project.institution?.type;
    const currentMembersCount = project.members.length + 1; // +1 for author

    if (institutionType === InstitutionType.SCHOOL) {
      if (currentMembersCount >= 3) {
        throw new BadRequestException(
          'Project member limit reached for School (3 members)',
        );
      }
    } else if (institutionType === InstitutionType.UNIVERSITY) {
      if (currentMembersCount >= 50) {
        throw new BadRequestException(
          'Project member limit reached for University (50 members)',
        );
      }
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
