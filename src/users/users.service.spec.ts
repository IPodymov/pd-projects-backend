import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { StudentGroupsService } from '../student-groups/student-groups.service';

const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockRolesService = {
  getRoleByValue: jest.fn(),
};

const mockStudentGroupsService = {
  findOne: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: StudentGroupsService,
          useValue: mockStudentGroupsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user with STUDENT role', async () => {
      const createUserDto = { email: 'test@test.com', password: 'password' };
      const role = { id: 1, value: 'STUDENT', description: 'Student' };
      const user = { ...createUserDto, roles: [role] };

      mockUserRepository.create.mockReturnValue(user);
      mockRolesService.getRoleByValue.mockResolvedValue(role);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.createUser(createUserDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRolesService.getRoleByValue).toHaveBeenCalledWith('STUDENT');
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@test.com';
      const user = { id: 1, email, roles: [] };

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getUserByEmail(email);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email },
        relations: ['roles'],
      });
      expect(result).toEqual(user);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const id = 1;
      const user = {
        id,
        email: 'test@test.com',
        password: 'hashedPassword',
        roles: [],
        projects: [],
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...expectedProfile } = user;

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.getProfile(id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['roles', 'projects', 'group', 'group.institution'],
      });
      expect(result).toEqual(expectedProfile);
    });
  });
});
