import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { GraphQLError } from 'graphql';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request: any;

    // Check if context is GraphQL or HTTP
    if (context.getType().toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    } else {
      // Http
      request = context.switchToHttp().getRequest();
    }

    const authHeader = request.headers.authorization;

    // If no token → do NOT THROW → return false (GraphQL handles it safely)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new GraphQLError('Unauthorized');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
        issuer: (iss) => iss.startsWith('https://'),
      });

      request.user = {
        clerkId: payload.sub,
        sessionId: payload.sid,
      };

      return true;
    } catch (error) {
      // DO NOT throw Nest UnauthorizedException → causes loops
      throw new GraphQLError('Unauthorized');
    }
  }
}
