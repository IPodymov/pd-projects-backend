import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.Authentication as string | undefined;
          return token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY', // Should be in env
    });
  }

  validate(payload: { id: number; email: string; roles: any[] }): {
    id: number;
    email: string;
    roles: any[];
  } {
    return { id: payload.id, email: payload.email, roles: payload.roles };
  }
}
