import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
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
  private readonly CACHE_KEYS = {
    ALL_PROJECTS: 'projects:all',
    PROJECT_PREFIX: 'project:',
    PROJECTS_LIST_KEYS: 'projects:list:keys', // Track all list cache keys
  };

  private getCacheKey(
    key: string,
    userId?: number,
    search?: string,
    institutionId?: number,
  ): string {
    if (key === this.CACHE_KEYS.ALL_PROJECTS) {
      return `${key}:${userId || 'public'}:${search || 'none'}:${institutionId || 'none'}`;
    }
    return key;
  }

  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(ProjectLink)
    private projectLinkRepository: Repository<ProjectLink>,
    @InjectRepository(ProjectHistory)
    private projectHistoryRepository: Repository<ProjectHistory>,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private cacheGet<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  private async cacheSet<T>(
    key: string,
    value: T,
    ttlMs: number,
  ): Promise<void> {
    await this.cacheManager.set(key, value, ttlMs);
  }

  private async cacheDel(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async create(createProjectDto: CreateProjectDto, user: User) {
    const fullUser = await this.usersService.getProfile(user.id);

    // Check if student is allowed to create project (Grade >= 7)
    const isStudent = user.roles.some((role) =>
      ['STUDENT', 'SCHOOL_STUDENT'].includes(role.value),
    );
    if (isStudent) {
      if (fullUser && fullUser.group) {
        if (fullUser.group.grade && fullUser.group.grade < 7) {
          throw new ForbiddenException(
            'Projects are only allowed from 7th grade',
          );
        }
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

    const savedProject = await this.projectRepository.save(project);

    // Invalidate all projects cache after creation
    await this.invalidateProjectsCache();

    return savedProject;
  }

  async findAll(user?: User, search?: string, institutionId?: number) {
    const cacheKey = this.getCacheKey(
      this.CACHE_KEYS.ALL_PROJECTS,
      user?.id,
      search,
      institutionId,
    );

    // Try to get from cache
    const cachedProjects = await this.cacheGet<Project[]>(cacheKey);
    if (cachedProjects) {
      return cachedProjects;
    }

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
        if (institutionId) {
          query.andWhere('institution.id = :institutionId', { institutionId });
        }
      } else {
        // Обычные пользователи (студенты)
        const conditions: string[] = [];
        const parameters: Record<string, any> = {
          userId: user.id,
          approvedStatus: ProjectStatus.APPROVED,
        };

        // Пользователь видит свои проекты
        conditions.push('project.author.id = :userId');

        // Пользователь видит проекты, где он участник
        conditions.push(
          '(:userId IN (SELECT "userId" FROM "projects_members_users" WHERE "projectId" = project.id))',
        );

        const isSchoolStudent = user.roles.some(
          (role) => role.value === 'SCHOOL_STUDENT',
        );
        const isUniversityStudent = user.roles.some(
          (role) => role.value === 'STUDENT',
        );

        // Одобренные проекты
        if (institutionId) {
          conditions.push(
            '(project.status = :approvedStatus AND institution.id = :institutionId)',
          );
          parameters.institutionId = institutionId;
        } else if (isSchoolStudent) {
          conditions.push(
            '(project.status = :approvedStatus AND institution.type = :institutionType)',
          );
          parameters.institutionType = InstitutionType.SCHOOL;
        } else if (isUniversityStudent) {
          conditions.push(
            '(project.status = :approvedStatus AND institution.type = :institutionType)',
          );
          parameters.institutionType = InstitutionType.UNIVERSITY;
        } else {
          conditions.push('project.status = :approvedStatus');
        }

        query.andWhere(`(${conditions.join(' OR ')})`, parameters);
      }
    } else {
      // Публичный доступ: только одобренные проекты
      query.andWhere('project.status = :status', {
        status: ProjectStatus.APPROVED,
      });

      if (institutionId) {
        query.andWhere('institution.id = :institutionId', { institutionId });
      }
    }

    const projects = await query.getMany();

    // Cache the result with 5 minute TTL
    await this.cacheSet(cacheKey, projects, 5 * 60 * 1000);

    // Track this key for later invalidation
    await this.trackProjectsListKey(cacheKey);

    return projects;
  }

  async findOne(id: number) {
    const cacheKey = `${this.CACHE_KEYS.PROJECT_PREFIX}${id}`;

    // Try to get from cache
    const cachedProject = await this.cacheGet<Project>(cacheKey);
    if (cachedProject) {
      return cachedProject;
    }

    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['links', 'author', 'history', 'members'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Cache the result with 5 minute TTL
    await this.cacheSet(cacheKey, project, 5 * 60 * 1000);

    return project;
  }

  async uploadFiles(id: number, files: string[], user: User) {
    const project = await this.findOne(id);

    // Check if user is author or member
    const isAuthor = project.author.id === user.id;
    const isMember = project.members.some((m) => m.id === user.id);

    if (!isAuthor && !isMember) {
      throw new ForbiddenException('Only author or members can upload files');
    }

    // Track history
    const history = new ProjectHistory();
    history.project = project;
    history.changedBy = user;
    history.changes = { filesUploaded: files };
    await this.projectHistoryRepository.save(history);

    // Invalidate cache for this project
    await this.invalidateProjectCache(id);

    return { success: true, filesCount: files.length };
  }

  async generateInvitation(id: number, user: User) {
    const project = await this.findOne(id);
    if (project.author.id !== user.id) {
      throw new ForbiddenException('Only author can generate invitation');
    }
    const token = uuidv4();
    project.invitationToken = token;
    await this.projectRepository.save(project);

    // Invalidate cache for this project
    await this.invalidateProjectCache(id);

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
    const savedProject = await this.projectRepository.save(project);

    // Invalidate cache for this project and all projects
    await this.invalidateProjectCache(project.id);
    await this.invalidateProjectsCache();

    return savedProject;
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

    if (updateProjectDto.links) {
      await this.projectLinkRepository.delete({ project: { id: project.id } });
      project.links = updateProjectDto.links.map((linkDto) => {
        const link = new ProjectLink();
        link.url = linkDto.url;
        link.description = linkDto.description;
        return link;
      });
    }

    const updatedProject = await this.projectRepository.save(project);

    // Invalidate cache for this specific project
    await this.invalidateProjectCache(id);
    // Invalidate all projects cache
    await this.invalidateProjectsCache();

    return updatedProject;
  }

  async remove(id: number) {
    const project = await this.findOne(id);
    const result = await this.projectRepository.remove(project);

    // Invalidate cache for this specific project
    await this.invalidateProjectCache(id);
    // Invalidate all projects cache
    await this.invalidateProjectsCache();

    return result;
  }

  /**
   * Invalidate cache for a specific project
   */
  private async invalidateProjectCache(id: number): Promise<void> {
    const cacheKey = `${this.CACHE_KEYS.PROJECT_PREFIX}${id}`;
    await this.cacheDel(cacheKey);
  }

  /**
   * Track a projects list cache key for later invalidation
   */
  private async trackProjectsListKey(key: string): Promise<void> {
    try {
      const keys =
        (await this.cacheGet<string[]>(this.CACHE_KEYS.PROJECTS_LIST_KEYS)) ||
        [];
      if (!keys.includes(key)) {
        keys.push(key);
        // Store the keys list with a longer TTL (10 minutes)
        await this.cacheSet(
          this.CACHE_KEYS.PROJECTS_LIST_KEYS,
          keys,
          10 * 60 * 1000,
        );
      }
    } catch (error) {
      // If tracking fails, just log and continue
      console.warn('Failed to track projects list key:', error);
    }
  }

  /**
   * Invalidate all projects cache (all variations with different filters)
   */
  private async invalidateProjectsCache(): Promise<void> {
    try {
      const keys =
        (await this.cacheGet<string[]>(this.CACHE_KEYS.PROJECTS_LIST_KEYS)) ||
        [];

      // Delete all tracked list cache keys
      for (const key of keys) {
        await this.cacheDel(key);
      }

      // Clear the tracking key itself
      await this.cacheDel(this.CACHE_KEYS.PROJECTS_LIST_KEYS);
    } catch (error) {
      console.warn('Failed to invalidate projects cache:', error);
    }
  }
}
