import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    console.log('🟦 DEBUG User in RolesGuard:', request.user);
    // THE FIX → correct field for role
    const userRole = request.user?.role || request.user?.activeRole;

    if (!userRole) {
      console.log('❌ No role found in request.user');
      return false;
    }

    // Normalize for safety
    const normalizedRole = userRole.toUpperCase();

    const allowed = requiredRoles.includes(normalizedRole);

    if (!allowed) {
      console.log(
        '❌ User role not allowed:',
        normalizedRole,
        'Required:',
        requiredRoles,
      );
    }

    return allowed;
  }
}
