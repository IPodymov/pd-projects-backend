import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {CreateStudentGroupDto} from './dto/create-student-group.dto';
import {UpdateStudentGroupDto} from './dto/update-student-group.dto';
import {StudentGroup} from './entities/student-group.entity';
import {InstitutionsService} from '../institutions/institutions.service';

@Injectable()
export class StudentGroupsService {
    constructor(
        @InjectRepository(StudentGroup) private studentGroupRepository: Repository<StudentGroup>,
        private institutionsService: InstitutionsService
    ) {
    }

    async create(createStudentGroupDto: CreateStudentGroupDto) {
        const institution = await this.institutionsService.findOne(createStudentGroupDto.institutionId);
        const group = this.studentGroupRepository.create({
            name: createStudentGroupDto.name,
            institution: institution
        });
        return await this.studentGroupRepository.save(group);
    }

    async findAll() {
        return await this.studentGroupRepository.find({relations: ['institution']});
    }

    async findOne(id: number) {
        const group = await this.studentGroupRepository.findOne({where: {id}, relations: ['institution', 'students']});
        if (!group) {
            throw new NotFoundException(`Student Group with ID ${id} not found`);
        }
        return group;
    }

    async update(id: number, updateStudentGroupDto: UpdateStudentGroupDto) {
        const group = await this.findOne(id);
        if (updateStudentGroupDto.name) {
            group.name = updateStudentGroupDto.name;
        }
        if (updateStudentGroupDto.institutionId) {
            const institution = await this.institutionsService.findOne(updateStudentGroupDto.institutionId);
            group.institution = institution;
        }
        return await this.studentGroupRepository.save(group);
    }

    async remove(id: number) {
        const group = await this.findOne(id);
        return await this.studentGroupRepository.remove(group);
    }
}
