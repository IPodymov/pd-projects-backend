import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {User} from './entities/user.entity';
import {RolesService} from '../roles/roles.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private rolesService: RolesService
    ) {
    }

    async createUser(dto: CreateUserDto) {
        const user = this.userRepository.create(dto);
        const role = await this.rolesService.getRoleByValue("STUDENT");
        if (role) {
            user.roles = [role];
        }
        await this.userRepository.save(user);
        return user;
    }

    async getUserByEmail(email: string) {
        const user = await this.userRepository.findOne({where: {email}, relations: ['roles']});
        return user;
    }

    async getProfile(id: number) {
        const user = await this.userRepository.findOne({
            where: {id},
            relations: ['roles', 'projects']
        });
        // Filter sensitive info if needed, but for now return as is (password should be excluded ideally)
        if (user) {
            const {password, ...result} = user;
            return result;
        }
        return null;
    }

    async setResetToken(userId: number, token: string, expires: Date) {
        await this.userRepository.update(userId, {
            resetPasswordToken: token,
            resetPasswordExpires: expires
        });
    }

    async findByResetToken(token: string) {
        return await this.userRepository.findOne({where: {resetPasswordToken: token}});
    }

    async updatePassword(userId: number, password: string) {
        await this.userRepository.update(userId, {
            password: password,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });
    }

    create(createUserDto: CreateUserDto) {
        return this.createUser(createUserDto);
    }

    findAll() {
        return `This action returns all users`;
    }

    findOne(id: number) {
        return `This action returns a #${id} user`;
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`;
    }

    remove(id: number) {
        return `This action removes a #${id} user`;
    }
}
