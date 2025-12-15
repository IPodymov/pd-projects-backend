import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectLink } from './entities/project-link.entity';
import { ProjectHistory } from './entities/project-history.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
      @InjectRepository(Project) private projectRepository: Repository<Project>,
      @InjectRepository(ProjectLink) private projectLinkRepository: Repository<ProjectLink>,
      @InjectRepository(ProjectHistory) private projectHistoryRepository: Repository<ProjectHistory>,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: User) {
    const project = new Project();
    project.title = createProjectDto.title;
    project.description = createProjectDto.description;
    project.author = user;

    const isStaffOrAdmin = user.roles.some(role => ['ADMIN', 'UNIVERSITY_STAFF'].includes(role.value));
    project.status = isStaffOrAdmin ? ProjectStatus.APPROVED : ProjectStatus.PENDING;

    project.links = createProjectDto.links.map(linkDto => {
        const link = new ProjectLink();
        link.url = linkDto.url;
        link.description = linkDto.description;
        return link;
    });

    return await this.projectRepository.save(project);
  }

  async findAll() {
    return await this.projectRepository.find({ relations: ['links', 'author', 'history'] });
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({ where: { id }, relations: ['links', 'author', 'history'] });
    if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
    }
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
    if (updateProjectDto.description) project.description = updateProjectDto.description;
    if (updateProjectDto.status) project.status = updateProjectDto.status;

    // Update links if provided (replace strategy for simplicity, or append? Requirement says "update project". Usually implies replacing the list or specific operations. Let's replace for now as it's easier to manage via DTO)
    if (updateProjectDto.links) {
        // Remove old links? Or just add new ones?
        // If we want to support editing existing links, we need IDs in DTO.
        // Given the simple DTO, let's assume we replace the links.
        await this.projectLinkRepository.delete({ project: { id: project.id } });
        project.links = updateProjectDto.links.map(linkDto => {
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
