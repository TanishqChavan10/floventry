import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PLAN_KEY } from '../decorators/plan.decorator';

const PLAN_HIERARCHY: Record<string, number> = {
  FREE: 0,
  STANDARD: 1,
  PRO: 2,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.getAllAndOverride<string>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const company = user.company;
    if (!company) {
      throw new ForbiddenException('Company not found');
    }

    const plan = company.plan;
    if (!plan) {
      throw new ForbiddenException('Plan not found');
    }

    const userLevel = PLAN_HIERARCHY[plan];
    if (userLevel === undefined) {
      throw new ForbiddenException(`Unknown plan: ${plan}`);
    }

    const requiredLevel = PLAN_HIERARCHY[requiredPlan];

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `This feature requires the ${requiredPlan} plan or higher`,
      );
    }

    return true;
  }
}
