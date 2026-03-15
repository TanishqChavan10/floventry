import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GraphQLError } from 'graphql';
import * as jwt from 'jsonwebtoken';

// Must mock @nestjs/graphql BEFORE importing AuthGuard, so transitive
// imports that use @Field / @ObjectType decorators don't blow up.
jest.mock('@nestjs/graphql', () => {
  const noop = () => () => {};
  return {
    GqlExecutionContext: { create: (ctx: any) => ctx },
    ObjectType: noop,
    Field: noop,
    ID: 'ID',
    Int: 'Int',
    Float: 'Float',
    InputType: noop,
    registerEnumType: jest.fn(),
    ArgsType: noop,
    Query: noop,
    Mutation: noop,
    Resolver: noop,
    Args: noop,
    ResolveField: noop,
    Parent: noop,
    Subscription: noop,
    Context: noop,
  };
});

// Mock AuthService module so its transitive entity imports are never resolved.
jest.mock('../../auth/auth.service');

import { AuthGuard } from '../../auth/guards/auth.guard';
import { AuthService } from '../../auth/auth.service';

const JWT_SECRET = 'test-secret';
const SUPABASE_USER_ID = 'sup-user-123';

function createToken(payload: Record<string, any> = {}) {
  return jwt.sign(
    { sub: SUPABASE_USER_ID, email: 'test@example.com', ...payload },
    JWT_SECRET,
    { algorithm: 'HS256' },
  );
}

const INTERNAL_USER = {
  id: 'internal-1',
  email: 'test@example.com',
  activeCompanyId: 'company-1',
  userCompanies: [{ company_id: 'company-1', role: 'OWNER' }],
};

function createHttpContext(headers: Record<string, string> = {}) {
  const request: any = { headers };
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    __request: request,
  } as any;
}

function createGqlContext(headers: Record<string, string> = {}) {
  const request: any = { headers };
  return {
    getType: () => 'graphql',
    getContext: () => ({ req: request }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    __request: request,
  } as any;
}

function createGqlContextNoReq() {
  return {
    getType: () => 'graphql',
    getContext: () => ({ req: undefined }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: { syncUser: jest.Mock; getUserById: jest.Mock };

  beforeEach(async () => {
    authService = {
      syncUser: jest.fn().mockResolvedValue(undefined),
      getUserById: jest.fn().mockResolvedValue(INTERNAL_USER),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(JWT_SECRET) },
        },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  // ─── Valid user ────────────────────────────────────────────

  describe('valid user', () => {
    it('should allow when valid token is present (HTTP)', async () => {
      const token = createToken();
      const ctx = createHttpContext({ authorization: `Bearer ${token}` });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should attach user to request', async () => {
      const token = createToken();
      const ctx = createHttpContext({ authorization: `Bearer ${token}` });
      await guard.canActivate(ctx);
      expect(ctx.__request.user).toBeDefined();
      expect(ctx.__request.user.userId).toBe('internal-1');
      expect(ctx.__request.user.role).toBe('OWNER');
      expect(ctx.__request.user.email).toBe('test@example.com');
    });

    it('should call syncUser and getUserById', async () => {
      const token = createToken();
      const ctx = createHttpContext({ authorization: `Bearer ${token}` });
      await guard.canActivate(ctx);
      expect(authService.syncUser).toHaveBeenCalledWith(SUPABASE_USER_ID);
      expect(authService.getUserById).toHaveBeenCalledWith(SUPABASE_USER_ID);
    });
  });

  // ─── No user / missing auth ────────────────────────────────

  describe('no user', () => {
    it('should throw when no authorization header', async () => {
      const ctx = createHttpContext({});
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });

    it('should throw when authorization header has no Bearer prefix', async () => {
      const ctx = createHttpContext({ authorization: 'Basic abc123' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });

    it('should throw when token is invalid', async () => {
      const ctx = createHttpContext({
        authorization: 'Bearer invalid.jwt.token',
      });
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });

    it('should throw when token has no subject', async () => {
      const token = jwt.sign({ email: 'a@b.com' }, JWT_SECRET, {
        algorithm: 'HS256',
      });
      const ctx = createHttpContext({ authorization: `Bearer ${token}` });
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });
  });

  // ─── GraphQL context ───────────────────────────────────────

  describe('graphql context', () => {
    it('should allow when valid token via GraphQL context', async () => {
      const token = createToken();
      const ctx = createGqlContext({ authorization: `Bearer ${token}` });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should attach user in GraphQL context', async () => {
      const token = createToken();
      const ctx = createGqlContext({ authorization: `Bearer ${token}` });
      await guard.canActivate(ctx);
      expect(ctx.__request.user).toBeDefined();
      expect(ctx.__request.user.authId).toBe(SUPABASE_USER_ID);
    });

    it('should throw when no auth header in GraphQL context', async () => {
      const ctx = createGqlContext({});
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });
  });

  // ─── Error cases ───────────────────────────────────────────

  describe('errors', () => {
    it('should throw when request is undefined (GraphQL)', async () => {
      const ctx = createGqlContextNoReq();
      await expect(guard.canActivate(ctx)).rejects.toThrow('Unauthorized');
    });

    it('should throw when token is expired', async () => {
      const token = jwt.sign(
        { sub: SUPABASE_USER_ID, exp: Math.floor(Date.now() / 1000) - 60 },
        JWT_SECRET,
        { algorithm: 'HS256' },
      );
      const ctx = createHttpContext({ authorization: `Bearer ${token}` });
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });

    it('should throw when token signed with wrong secret', async () => {
      const token = jwt.sign({ sub: SUPABASE_USER_ID }, 'wrong-secret', {
        algorithm: 'HS256',
      });
      const ctx = createHttpContext({ authorization: `Bearer ${token}` });
      await expect(guard.canActivate(ctx)).rejects.toThrow(GraphQLError);
    });
  });
});
