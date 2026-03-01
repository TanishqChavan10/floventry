import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * REST-only Supabase Auth guard.
 * Class name kept as `RestAuthGuard` (no Supabase reference to change).
 */
@Injectable()
export class RestAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.substring(7);

    try {
      const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET')!;
      const payload = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      request.user = {
        authId: payload.sub, // kept key name for backward compat
        sessionId: payload.session_id || payload.sid,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
