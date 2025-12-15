import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { Institution } from './entities/institution.entity';

@Injectable()
export class InstitutionsService {
  constructor(
      @InjectRepository(Institution) private institutionRepository: Repository<Institution>
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto) {
    return await this.institutionRepository.save(createInstitutionDto);
  }

  async findAll() {
    return await this.institutionRepository.find({ relations: ['groups'] });
  }

  async findOne(id: number) {
    const institution = await this.institutionRepository.findOne({ where: { id }, relations: ['groups'] });
    if (!institution) {
        throw new NotFoundException(`Institution with ID ${id} not found`);
    }
    return institution;
  }

  async update(id: number, updateInstitutionDto: UpdateInstitutionDto) {
    await this.institutionRepository.update(id, updateInstitutionDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const institution = await this.findOne(id);
    return await this.institutionRepository.remove(institution);
  }
}
