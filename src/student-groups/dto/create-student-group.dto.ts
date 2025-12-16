import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateStudentGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  institutionId: number;
}
