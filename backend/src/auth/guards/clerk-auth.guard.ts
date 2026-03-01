import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { AuthService } from '../auth.service';

/**
 * Supabase Auth guard (class name kept as `AuthGuard` for backward compat
 * with 30+ resolver imports — will be renamed in Phase 6 cleanup).
 *
 * Verifies the Supabase JWT from the Authorization header, syncs the user into
 * the local database, and attaches the enriched user object to `request.user`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request: any;

    // Determine whether request is GraphQL or HTTP
    const contextType = context.getType<string>();
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      request = gqlCtx.getContext()?.req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    if (!request) {
      throw new GraphQLError('Unauthorized');
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new GraphQLError('Unauthorized');
    }

    const token = authHeader.substring(7);

    try {
      // Verify Supabase JWT using the project's JWT secret
      const jwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET')!;
      const payload = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      const supabaseUserId = payload.sub;
      if (!supabaseUserId) {
        throw new GraphQLError('Invalid token: no subject');
      }

      //-------------------------------------------------------
      // 1. Sync user into local DB (ensures internal user exists)
      //-------------------------------------------------------
      await this.authService.syncUser(supabaseUserId);

      //-------------------------------------------------------
      // 2. Fetch internal user (your DB user) with relations
      //-------------------------------------------------------
      const internalUser =
        await this.authService.getUserById(supabaseUserId);

      //-------------------------------------------------------
      // 3. Determine activeCompanyId and role from DB
      //-------------------------------------------------------
      const activeCompanyId = internalUser?.activeCompanyId ?? undefined;

      const dbRoleForActiveCompany = activeCompanyId
        ? (internalUser as any)?.userCompanies?.find(
            (uc: any) => uc.company_id === activeCompanyId,
          )?.role
        : undefined;

      const activeRole = dbRoleForActiveCompany || undefined;

      //-------------------------------------------------------
      // 4. Get email from Supabase Auth user (or fallback to DB)
      //-------------------------------------------------------
      const email = payload.email || internalUser?.email;

      //-------------------------------------------------------
      // 5. Attach the user object for downstream guards/resolvers
      //-------------------------------------------------------
      request.user = {
        id: internalUser?.id,
        userId: internalUser?.id,
        authId: supabaseUserId, // kept for backward compat
        sessionId: payload.session_id || payload.sid || undefined,
        activeCompanyId,
        role:
          typeof activeRole === 'string'
            ? activeRole.toUpperCase()
            : activeRole,
        email,
      };

      // Keep compatibility with older code
      request.role = request.user.role;

      return true;
    } catch (error) {
      console.error('Auth Error:', error);
      throw new GraphQLError('Unauthorized');
    }
  }
}
