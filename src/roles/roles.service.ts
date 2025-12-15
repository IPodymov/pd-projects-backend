import {Injectable, OnModuleInit} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {CreateRoleDto} from './dto/create-role.dto';
import {UpdateRoleDto} from './dto/update-role.dto';
import {Role} from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(@InjectRepository(Role) private roleRepository: Repository<Role>) {
    }

    async onModuleInit() {
        const roles = [
            {value: 'ADMIN', description: 'Администратор'},
            {value: 'STUDENT', description: 'Учащийся'},
            {value: 'UNIVERSITY_STAFF', description: 'Сотрудник вуза'}
        ];

        for (const role of roles) {
            const existingRole = await this.getRoleByValue(role.value);
            if (!existingRole) {
                await this.createRole(role);
            }
        }
    }

    async createRole(dto: CreateRoleDto) {
        const role = await this.roleRepository.save(dto);
        return role;
    }

    async getRoleByValue(value: string) {
        const role = await this.roleRepository.findOne({where: {value}});
        return role;
    }

    create(createRoleDto: CreateRoleDto) {
        return 'This action adds a new role';
    }

    findAll() {
        return `This action returns all roles`;
    }

    findOne(id: number) {
        return `This action returns a #${id} role`;
    }

    update(id: number, updateRoleDto: UpdateRoleDto) {
        return `This action updates a #${id} role`;
    }

    remove(id: number) {
        return `This action removes a #${id} role`;
    }
}
