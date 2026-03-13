import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  private static readonly loggedSessionIds = new Map<string, number>();
  private static lastCleanupAtMs = 0;
  private static readonly cleanupIntervalMs = 5 * 60 * 1000;
  private static readonly sessionTtlMs = 60 * 60 * 1000;
  private static readonly maxTrackedSessions = 5000;

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

    this.debugUserOncePerSession(request.user);
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

  private debugUserOncePerSession(user: any): void {
    // Disabled by default so production logs (e.g., Render) don't get spammed.
    if (process.env.ROLES_GUARD_DEBUG_USER !== 'true') {
      return;
    }

    const sessionId: string | undefined =
      user?.sessionId ?? user?.authId ?? user?.userId ?? user?.id;
    if (!sessionId) {
      return;
    }

    const now = Date.now();
    RolesGuard.cleanupLoggedSessions(now);

    if (RolesGuard.loggedSessionIds.has(sessionId)) {
      return;
    }

    RolesGuard.loggedSessionIds.set(sessionId, now);
    this.logger.debug(`User in RolesGuard: ${JSON.stringify(user)}`);
  }

  private static cleanupLoggedSessions(now: number): void {
    if (now - RolesGuard.lastCleanupAtMs < RolesGuard.cleanupIntervalMs) {
      return;
    }
    RolesGuard.lastCleanupAtMs = now;

    for (const [sessionId, loggedAt] of RolesGuard.loggedSessionIds) {
      if (now - loggedAt > RolesGuard.sessionTtlMs) {
        RolesGuard.loggedSessionIds.delete(sessionId);
      }
    }

    // Hard cap to avoid unbounded memory growth in long-running processes.
    if (RolesGuard.loggedSessionIds.size > RolesGuard.maxTrackedSessions) {
      const overflow =
        RolesGuard.loggedSessionIds.size - RolesGuard.maxTrackedSessions;
      let removed = 0;
      for (const sessionId of RolesGuard.loggedSessionIds.keys()) {
        RolesGuard.loggedSessionIds.delete(sessionId);
        removed += 1;
        if (removed >= overflow) {
          break;
        }
      }
    }
  }
}
