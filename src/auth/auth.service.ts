import {HttpException, HttpStatus, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {CreateUserDto} from '../users/dto/create-user.dto';
import {UsersService} from '../users/users.service';
import {User} from '../users/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(private userService: UsersService,
                private jwtService: JwtService) {
    }

    async login(userDto: CreateUserDto) {
        const user = await this.validateUser(userDto);
        return this.generateToken(user);
    }

    async registration(userDto: CreateUserDto) {
        const candidate = await this.userService.getUserByEmail(userDto.email);
        if (candidate) {
            throw new HttpException('User with this email already exists', HttpStatus.BAD_REQUEST);
        }
        const hashPassword = await bcrypt.hash(userDto.password, 5);
        const user = await this.userService.createUser({...userDto, password: hashPassword});
        return this.generateToken(user);
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.userService.getUserByEmail(dto.email);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        const token = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 hour expiration

        await this.userService.setResetToken(user.id, token, expires);

        // Mock email sending
        console.log(`Password reset token for ${user.email}: ${token}`);

        return { message: 'Password reset email sent' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.userService.findByResetToken(dto.token);
        if (!user) {
            throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new HttpException('Token expired', HttpStatus.BAD_REQUEST);
        }

        const hashPassword = await bcrypt.hash(dto.newPassword, 5);
        await this.userService.updatePassword(user.id, hashPassword);

        return { message: 'Password updated successfully' };
    }

    private async generateToken(user: User) {
        const payload = {email: user.email, id: user.id, roles: user.roles};
        return {
            token: this.jwtService.sign(payload)
        }
    }

    private async validateUser(userDto: CreateUserDto) {
        const user = await this.userService.getUserByEmail(userDto.email);
        if (user) {
            const passwordEquals = await bcrypt.compare(userDto.password, user.password);
            if (passwordEquals) {
                return user;
            }
        }
        throw new UnauthorizedException({message: 'Incorrect email or password'});
    }
}
