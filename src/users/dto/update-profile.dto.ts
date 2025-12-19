import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EducationLevel } from '../entities/user.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @IsString()
  @IsOptional()
  readonly middleName?: string;

  @IsNumber()
  @IsOptional()
  readonly groupId?: number;

  @IsEnum(EducationLevel)
  @IsOptional()
  readonly educationLevel?: EducationLevel;
}
