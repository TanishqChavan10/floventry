import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { verifyToken, clerkClient } from '@clerk/clerk-sdk-node';
import { GraphQLError } from 'graphql';
import { ClerkService } from '../clerk.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private clerkService: ClerkService,
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
      // Verify Clerk token
      const payload = await verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
        issuer: (iss) => iss.startsWith('https://'),
      });

      const clerkId = payload.sub;

      //-------------------------------------------------------
      // 1️⃣ Sync user into local DB (ensures internal user exists)
      //-------------------------------------------------------
      await this.clerkService.syncUser(clerkId);

      //-------------------------------------------------------
      // 2️⃣ Fetch internal user (your DB user) for correct UUID
      //-------------------------------------------------------
      const internalUser = await this.clerkService.getUserByClerkId(clerkId);

      //-------------------------------------------------------
      // 3️⃣ Fetch metadata from Clerk Dashboard
      //-------------------------------------------------------
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const metadata = clerkUser.publicMetadata as {
        activeCompanyId?: string;
        activeRole?: string;
      };

      // Prefer DB as the source of truth (membership-validated by switchCompany/createCompany).
      // Clerk metadata can be temporarily stale (or fail to update), which would cause company-
      // scoped queries (like products) to return empty arrays.
      const activeCompanyId =
        (internalUser as any)?.activeCompanyId ?? metadata.activeCompanyId;

      const dbRoleForActiveCompany = activeCompanyId
        ? (internalUser as any)?.userCompanies?.find(
            (uc: any) => uc.company_id === activeCompanyId,
          )?.role
        : undefined;

      const activeRole =
        (dbRoleForActiveCompany ?? metadata.activeRole) || undefined;

      //-------------------------------------------------------
      // 4️⃣ Attach the CORRECT user object for RolesGuard
      //-------------------------------------------------------
      request.user = {
        // NOTE: historically many resolvers/services expect `user.userId`.
        // Keep both `id` and `userId` for backwards compatibility.
        id: internalUser?.id, // 🟩 Internal user id (Clerk ID in this project)
        userId: internalUser?.id,
        clerkId: clerkId,
        sessionId: payload.sid,
        activeCompanyId,
        role:
          typeof activeRole === 'string'
            ? activeRole.toUpperCase()
            : activeRole,
        email: clerkUser.emailAddresses[0]?.emailAddress,
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
