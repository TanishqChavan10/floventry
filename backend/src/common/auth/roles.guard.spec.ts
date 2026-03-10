import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../auth/guards/roles.guard';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: (ctx: any) => ctx,
  },
}));

function createMockContext(role?: string, omit?: 'user' | 'role') {
  let user: any = { role };

  if (omit === 'role') user = {};
  if (omit === 'user') user = undefined;

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getContext: () => ({ req: { user } }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  // ─── Single role: @Roles('OWNER') ─────────────────────────

  describe('single role', () => {
    beforeEach(() => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['OWNER']);
    });

    it('should allow OWNER', () => {
      expect(guard.canActivate(createMockContext('OWNER'))).toBe(true);
    });

    it('should deny ADMIN', () => {
      expect(guard.canActivate(createMockContext('ADMIN'))).toBe(false);
    });

    it('should deny MANAGER', () => {
      expect(guard.canActivate(createMockContext('MANAGER'))).toBe(false);
    });

    it('should deny STAFF', () => {
      expect(guard.canActivate(createMockContext('STAFF'))).toBe(false);
    });
  });

  // ─── Multiple roles: @Roles('OWNER', 'ADMIN') ─────────────

  describe('multiple roles', () => {
    beforeEach(() => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'OWNER',
        'ADMIN',
      ]);
    });

    it('should allow OWNER', () => {
      expect(guard.canActivate(createMockContext('OWNER'))).toBe(true);
    });

    it('should allow ADMIN', () => {
      expect(guard.canActivate(createMockContext('ADMIN'))).toBe(true);
    });

    it('should deny MANAGER', () => {
      expect(guard.canActivate(createMockContext('MANAGER'))).toBe(false);
    });

    it('should deny STAFF', () => {
      expect(guard.canActivate(createMockContext('STAFF'))).toBe(false);
    });
  });

  // ─── No decorator ──────────────────────────────────────────

  describe('no decorator', () => {
    it('should allow access when no roles are required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      expect(guard.canActivate(createMockContext('STAFF'))).toBe(true);
    });
  });

  // ─── Error cases ───────────────────────────────────────────

  describe('error cases', () => {
    beforeEach(() => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['OWNER']);
    });

    it('should deny when no user', () => {
      expect(guard.canActivate(createMockContext(undefined, 'user'))).toBe(
        false,
      );
    });

    it('should deny when no role', () => {
      expect(guard.canActivate(createMockContext(undefined, 'role'))).toBe(
        false,
      );
    });

    it('should deny invalid role', () => {
      expect(guard.canActivate(createMockContext('SUPERADMIN'))).toBe(false);
    });
  });
});
