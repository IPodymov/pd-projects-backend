import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';

const mockRoleRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
};

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const dto = { value: 'TEST', description: 'Test Role' };
      const role = { id: 1, ...dto };

      mockRoleRepository.save.mockResolvedValue(role);

      const result = await service.createRole(dto);

      expect(mockRoleRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(role);
    });
  });

  describe('getRoleByValue', () => {
    it('should return a role by value', async () => {
      const value = 'TEST';
      const role = { id: 1, value, description: 'Test Role' };

      mockRoleRepository.findOne.mockResolvedValue(role);

      const result = await service.getRoleByValue(value);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { value },
      });
      expect(result).toEqual(role);
    });
  });
});
