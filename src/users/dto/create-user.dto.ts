import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { EducationLevel } from '../entities/user.entity';

export class CreateUserDto {
  @IsString({ message: 'Must be a string' })
  @IsEmail({}, { message: 'Incorrect email' })
  readonly email: string;

  @IsString({ message: 'Must be a string' })
  @Length(4, 16, { message: 'Password must be between 4 and 16 characters' })
  readonly password: string;

  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @IsString()
  @IsOptional()
  readonly middleName?: string;

  @IsEnum(EducationLevel)
  @IsOptional()
  readonly educationLevel?: EducationLevel;
}
