import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { PlanGuard } from '../../auth/guards/plan.guard';

// GqlExecutionContext.create() needs to be mocked because PlanGuard
// calls it to extract the request from a GraphQL context.
jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: (ctx: any) => ctx,
  },
}));

function createMockContext(plan?: string, omit?: 'user' | 'company' | 'plan') {
  let user: any = {
    company: { plan },
  };

  if (omit === 'plan') user = { company: {} };
  if (omit === 'company') user = {};
  if (omit === 'user') user = undefined;

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getContext: () => ({ req: { user } }),
  } as any;
}

describe('PlanGuard', () => {
  let guard: PlanGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<PlanGuard>(PlanGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  // ─── STANDARD plan required ────────────────────────────────

  describe('STANDARD plan required', () => {
    beforeEach(() => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('STANDARD');
    });

    it('should deny FREE plan', () => {
      const ctx = createMockContext('FREE');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow STANDARD plan', () => {
      const ctx = createMockContext('STANDARD');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow PRO plan', () => {
      const ctx = createMockContext('PRO');
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── PRO plan required ─────────────────────────────────────

  describe('PRO plan required', () => {
    beforeEach(() => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('PRO');
    });

    it('should deny FREE plan', () => {
      const ctx = createMockContext('FREE');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should deny STANDARD plan', () => {
      const ctx = createMockContext('STANDARD');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow PRO plan', () => {
      const ctx = createMockContext('PRO');
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── No decorator ──────────────────────────────────────────

  describe('no decorator', () => {
    it('should allow access when no plan is required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      const ctx = createMockContext('FREE');
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ─── Error cases ───────────────────────────────────────────

  describe('error cases', () => {
    beforeEach(() => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('STANDARD');
    });

    it('should throw when no user', () => {
      const ctx = createMockContext(undefined, 'user');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw when no company', () => {
      const ctx = createMockContext(undefined, 'company');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw when no plan', () => {
      const ctx = createMockContext(undefined, 'plan');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw on unknown plan', () => {
      const ctx = createMockContext('ULTRA');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
