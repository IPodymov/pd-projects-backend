import { IsString, Length } from "class-validator";

export class ResetPasswordDto {
    @IsString()
    readonly token: string;

    @IsString()
    @Length(4, 16)
    readonly newPassword: string;
}

