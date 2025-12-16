import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { InstitutionType } from '../entities/institution.entity';

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InstitutionType)
  type: InstitutionType;
}
