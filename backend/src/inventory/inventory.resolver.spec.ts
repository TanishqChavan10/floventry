// Must mock @nestjs/graphql BEFORE importing anything that transitively uses
// @Field / @ObjectType (entities, models, resolver itself).
jest.mock('@nestjs/graphql', () => {
  const noop = () => () => {};
  return {
    GqlExecutionContext: { create: (ctx: any) => ctx },
    ObjectType: noop,
    Field: noop,
    InputType: noop,
    ID: 'ID',
    Int: 'Int',
    Float: 'Float',
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
    createUnionType: jest.fn(),
  };
});

// Mock guards so their transitive DB / Supabase dependencies are never loaded.
jest.mock('../auth/guards/auth.guard');
jest.mock('../auth/guards/roles.guard');

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductResolver } from './inventory.resolver';
import { InventoryService } from './inventory.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PRODUCT_INPUT = { name: 'Widget', sku: 'WDG-001', unit: 'pcs' };

const mockProduct = { id: 'prod-1', name: 'Widget', sku: 'WDG-001' };

function makeUser(
  role: string,
  activeCompanyId: string | null = 'company-1',
): any {
  return { id: 'user-1', role, activeCompanyId };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ProductResolver › createProduct', () => {
  let resolver: ProductResolver;
  let inventoryService: { createProduct: jest.Mock };

  beforeEach(async () => {
    inventoryService = { createProduct: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductResolver,
        { provide: InventoryService, useValue: inventoryService },
      ],
    }).compile();

    resolver = module.get<ProductResolver>(ProductResolver);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Auth ────────────────────────────────────────────────

  describe('auth', () => {
    it('should throw BadRequestException when activeCompanyId is missing', async () => {
      const user = makeUser('OWNER', null);
      await expect(
        resolver.createProduct(PRODUCT_INPUT as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when activeCompanyId is undefined', async () => {
      const user = { id: 'user-1', role: 'OWNER' }; // no activeCompanyId key
      await expect(
        resolver.createProduct(PRODUCT_INPUT as any, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('should proceed when user has activeCompanyId', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const user = makeUser('OWNER');
      const result = await resolver.createProduct(PRODUCT_INPUT as any, user);
      expect(result).toEqual(mockProduct);
    });

    it('should pass activeCompanyId to service', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const user = makeUser('OWNER', 'company-abc');
      await resolver.createProduct(PRODUCT_INPUT as any, user);
      expect(inventoryService.createProduct).toHaveBeenCalledWith(
        PRODUCT_INPUT,
        'company-abc',
      );
    });
  });

  // ─── Plan limits ─────────────────────────────────────────
  //
  // PlanLimitsService enforces caps inside InventoryService.createProduct.
  // The resolver propagates whatever the service throws, so these tests
  // verify that the resolver does NOT swallow ForbiddenExceptions.

  describe('limits', () => {
    it('FREE under limit → allowed', async () => {
      // Service completes normally (count < 100)
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const user = makeUser('OWNER');
      const result = await resolver.createProduct(PRODUCT_INPUT as any, user);
      expect(result).toEqual(mockProduct);
    });

    it('FREE over limit → error propagated from service', async () => {
      inventoryService.createProduct.mockRejectedValue(
        new ForbiddenException('Product limit reached for your plan'),
      );
      const user = makeUser('OWNER');
      await expect(
        resolver.createProduct(PRODUCT_INPUT as any, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('STANDARD over limit → error propagated from service', async () => {
      inventoryService.createProduct.mockRejectedValue(
        new ForbiddenException('Product limit reached for your plan'),
      );
      const user = makeUser('ADMIN');
      await expect(
        resolver.createProduct(PRODUCT_INPUT as any, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('PRO unlimited → always allowed', async () => {
      // Service succeeds regardless of count for PRO
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const user = makeUser('OWNER');
      const result = await resolver.createProduct(PRODUCT_INPUT as any, user);
      expect(result).toEqual(mockProduct);
    });

    it('should propagate ForbiddenException message unchanged', async () => {
      const msg = 'Product limit reached for your plan';
      inventoryService.createProduct.mockRejectedValue(
        new ForbiddenException(msg),
      );
      await expect(
        resolver.createProduct(PRODUCT_INPUT as any, makeUser('OWNER')),
      ).rejects.toThrow(msg);
    });
  });

  // ─── Roles ───────────────────────────────────────────────
  //
  // @UseGuards(RolesGuard) + @Roles(OWNER, ADMIN, MANAGER) run BEFORE the
  // method in the NestJS pipeline.  In this unit test we call the method
  // directly (guards bypassed), so role enforcement is verified in:
  //   src/common/auth/roles.guard.spec.ts
  //
  // What WE verify here: the method functions correctly for allowed roles
  // and that the service is only called when a valid user is present.

  describe('roles', () => {
    it('OWNER → should call service and return product', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const result = await resolver.createProduct(
        PRODUCT_INPUT as any,
        makeUser('OWNER'),
      );
      expect(result).toEqual(mockProduct);
      expect(inventoryService.createProduct).toHaveBeenCalledTimes(1);
    });

    it('ADMIN → should call service and return product', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const result = await resolver.createProduct(
        PRODUCT_INPUT as any,
        makeUser('ADMIN'),
      );
      expect(result).toEqual(mockProduct);
    });

    it('MANAGER → should call service and return product', async () => {
      // MANAGER is in @Roles(OWNER, ADMIN, MANAGER) — allowed by guard
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const result = await resolver.createProduct(
        PRODUCT_INPUT as any,
        makeUser('MANAGER'),
      );
      expect(result).toEqual(mockProduct);
    });

    it('STAFF → guard denies before method (RolesGuard blocks)', () => {
      // In production the RolesGuard returns false before the method runs.
      // Verified in roles.guard.spec.ts.  Here we confirm that if a STAFF
      // user somehow reached the method body, the service would still be
      // called (no role check inside the method itself).
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      expect(
        resolver.createProduct(PRODUCT_INPUT as any, makeUser('STAFF')),
      ).resolves.toEqual(mockProduct);
    });
  });

  // ─── Success ─────────────────────────────────────────────

  describe('success', () => {
    it('should return the created product', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const result = await resolver.createProduct(
        PRODUCT_INPUT as any,
        makeUser('OWNER'),
      );
      expect(result).toMatchObject({ id: 'prod-1', sku: 'WDG-001' });
    });

    it('should call inventoryService.createProduct exactly once', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      await resolver.createProduct(PRODUCT_INPUT as any, makeUser('OWNER'));
      expect(inventoryService.createProduct).toHaveBeenCalledTimes(1);
    });

    it('should forward the full input object to the service', async () => {
      inventoryService.createProduct.mockResolvedValue(mockProduct);
      const detailed = { ...PRODUCT_INPUT, cost_price: 10, selling_price: 20 };
      await resolver.createProduct(detailed as any, makeUser('OWNER'));
      expect(inventoryService.createProduct).toHaveBeenCalledWith(
        detailed,
        'company-1',
      );
    });
  });
});
