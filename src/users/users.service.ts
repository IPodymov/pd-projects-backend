import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StudentGroupsService } from '../student-groups/student-groups.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private rolesService: RolesService,
    @Inject(forwardRef(() => StudentGroupsService))
    private studentGroupsService: StudentGroupsService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const user = this.userRepository.create(dto);
    const role = await this.rolesService.getRoleByValue('STUDENT');
    if (role) {
      user.roles = [role];
    }
    if (dto.educationLevel) {
      user.educationLevel = dto.educationLevel;
    }
    await this.userRepository.save(user);
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
    return user;
  }

  async getProfile(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'projects', 'group', 'group.institution'],
    });
    // Filter sensitive info if needed, but for now return as is (password should be excluded ideally)
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async setResetToken(userId: number, token: string, expires: Date) {
    await this.userRepository.update(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string) {
    return await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async updatePassword(userId: number, password: string) {
    await this.userRepository.update(userId, {
      password: password,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (dto.groupId) {
      const group = await this.studentGroupsService.findOne(dto.groupId);
      user.group = group;
    }
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.middleName) user.middleName = dto.middleName;
    if (dto.educationLevel) user.educationLevel = dto.educationLevel;

    await this.userRepository.save(user);
    return this.getProfile(userId);
  }

  create(createUserDto: CreateUserDto) {
    return this.createUser(createUserDto);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'group'],
    });
    if (!user) {
      // Handle not found if needed, or return null
    }
    return user;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
