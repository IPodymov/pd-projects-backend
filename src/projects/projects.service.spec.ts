import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectLink } from './entities/project-link.entity';
import { ProjectHistory } from './entities/project-history.entity';
import { User } from '../users/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

const mockProjectRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};

const mockProjectLinkRepository = {
  delete: jest.fn(),
};

const mockProjectHistoryRepository = {
  save: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(ProjectLink),
          useValue: mockProjectLinkRepository,
        },
        {
          provide: getRepositoryToken(ProjectHistory),
          useValue: mockProjectHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project with PENDING status for student', async () => {
      const createProjectDto = { title: 'Test Project', description: 'Desc', links: [] };
      const user = { id: 1, roles: [{ value: 'STUDENT' }] } as User;
      const savedProject = { id: 1, ...createProjectDto, status: ProjectStatus.PENDING, author: user };

      mockProjectRepository.save.mockResolvedValue(savedProject);

      const result = await service.create(createProjectDto, user);

      expect(result.status).toBe(ProjectStatus.PENDING);
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should create a project with APPROVED status for admin', async () => {
      const createProjectDto = { title: 'Test Project', description: 'Desc', links: [] };
      const user = { id: 1, roles: [{ value: 'ADMIN' }] } as User;
      const savedProject = { id: 1, ...createProjectDto, status: ProjectStatus.APPROVED, author: user };

      mockProjectRepository.save.mockResolvedValue(savedProject);

      const result = await service.create(createProjectDto, user);

      expect(result.status).toBe(ProjectStatus.APPROVED);
    });
  });

  describe('findOne', () => {
    it('should return a project if found', async () => {
      const project = { id: 1, title: 'Test' };
      mockProjectRepository.findOne.mockResolvedValue(project);

      const result = await service.findOne(1);
      expect(result).toEqual(project);
    });

    it('should throw NotFoundException if not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });
});

