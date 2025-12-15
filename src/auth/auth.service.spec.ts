import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt'); // Mock bcrypt module

const mockUsersService = {
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  setResetToken: jest.fn(),
  findByResetToken: jest.fn(),
  updatePassword: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return a token if validation is successful', async () => {
      const userDto = { email: 'test@test.com', password: 'password' };
      const user = { id: 1, email: 'test@test.com', password: 'hashedPassword', roles: [] };
      const token = 'jwt_token';

      mockUsersService.getUserByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Use mocked implementation
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(userDto);

      expect(result).toEqual({ token });
    });

    it('should throw UnauthorizedException if validation fails', async () => {
      const userDto = { email: 'test@test.com', password: 'wrongPassword' };
      const user = { id: 1, email: 'test@test.com', password: 'hashedPassword', roles: [] };

      mockUsersService.getUserByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Use mocked implementation

      await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registration', () => {
    it('should create a new user and return a token', async () => {
      const userDto = { email: 'new@test.com', password: 'password' };
      const user = { id: 1, ...userDto, roles: [] };
      const token = 'jwt_token';

      mockUsersService.getUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword'); // Use mocked implementation
      mockUsersService.createUser.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.registration(userDto);

      expect(mockUsersService.createUser).toHaveBeenCalled();
      expect(result).toEqual({ token });
    });

    it('should throw HttpException if user already exists', async () => {
      const userDto = { email: 'existing@test.com', password: 'password' };
      const user = { id: 1, ...userDto };

      mockUsersService.getUserByEmail.mockResolvedValue(user);

      await expect(service.registration(userDto)).rejects.toThrow(HttpException);
    });
  });
});
