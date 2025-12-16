import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentGroupDto } from './create-student-group.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateStudentGroupDto extends PartialType(CreateStudentGroupDto) {
  @IsNumber()
  @IsOptional()
  institutionId?: number;
}
