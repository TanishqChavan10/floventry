import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlanLimitsService } from './plan-limits.service';
import { CompanySettings } from '../../company/company-settings.entity';

const COMPANY_ID = 'test-company-id';

const mockSettings = (plan: string) => ({ company_id: COMPANY_ID, plan });

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  let findOne: jest.Mock;

  beforeEach(async () => {
    findOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        {
          provide: getRepositoryToken(CompanySettings),
          useValue: { findOne },
        },
      ],
    }).compile();

    service = module.get<PlanLimitsService>(PlanLimitsService);
  });

  // ─── Product limits ────────────────────────────────────────

  describe('product limits', () => {
    it('should allow FREE under limit', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 99),
      ).resolves.toBeUndefined();
    });

    it('should block FREE over limit', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 100),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow STANDARD under limit', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 499),
      ).resolves.toBeUndefined();
    });

    it('should block STANDARD over limit', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 500),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should always allow PRO', async () => {
      findOne.mockResolvedValue(mockSettings('PRO'));
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 999999),
      ).resolves.toBeUndefined();
    });
  });

  // ─── Warehouse limits ──────────────────────────────────────

  describe('warehouse limits', () => {
    it('should allow FREE 1 warehouse', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('warehouse', COMPANY_ID, 0),
      ).resolves.toBeUndefined();
    });

    it('should block FREE at 2 warehouses', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('warehouse', COMPANY_ID, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow STANDARD 3 warehouses', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('warehouse', COMPANY_ID, 2),
      ).resolves.toBeUndefined();
    });

    it('should block STANDARD at 4 warehouses', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('warehouse', COMPANY_ID, 3),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should always allow PRO', async () => {
      findOne.mockResolvedValue(mockSettings('PRO'));
      await expect(
        service.assertCanCreate('warehouse', COMPANY_ID, 999999),
      ).resolves.toBeUndefined();
    });
  });

  // ─── Member limits ─────────────────────────────────────────

  describe('member limits', () => {
    it('should allow FREE 2 members', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('member', COMPANY_ID, 1),
      ).resolves.toBeUndefined();
    });

    it('should block FREE at 3 members', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('member', COMPANY_ID, 2),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow STANDARD 5 members', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('member', COMPANY_ID, 4),
      ).resolves.toBeUndefined();
    });

    it('should block STANDARD at 6 members', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('member', COMPANY_ID, 5),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should always allow PRO', async () => {
      findOne.mockResolvedValue(mockSettings('PRO'));
      await expect(
        service.assertCanCreate('member', COMPANY_ID, 999999),
      ).resolves.toBeUndefined();
    });
  });

  // ─── Supplier limits ───────────────────────────────────────

  describe('supplier limits', () => {
    it('should allow FREE 10 suppliers', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('supplier', COMPANY_ID, 9),
      ).resolves.toBeUndefined();
    });

    it('should block FREE at 11 suppliers', async () => {
      findOne.mockResolvedValue(mockSettings('FREE'));
      await expect(
        service.assertCanCreate('supplier', COMPANY_ID, 10),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow STANDARD 50 suppliers', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('supplier', COMPANY_ID, 49),
      ).resolves.toBeUndefined();
    });

    it('should block STANDARD at 51 suppliers', async () => {
      findOne.mockResolvedValue(mockSettings('STANDARD'));
      await expect(
        service.assertCanCreate('supplier', COMPANY_ID, 50),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should always allow PRO', async () => {
      findOne.mockResolvedValue(mockSettings('PRO'));
      await expect(
        service.assertCanCreate('supplier', COMPANY_ID, 999999),
      ).resolves.toBeUndefined();
    });
  });

  // ─── Error cases ───────────────────────────────────────────

  describe('error cases', () => {
    it('should throw on unknown plan', async () => {
      findOne.mockResolvedValue(mockSettings('ULTRA'));
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 0),
      ).rejects.toThrow('Unknown plan: ULTRA');
    });

    it('should throw on missing settings', async () => {
      findOne.mockResolvedValue(null);
      await expect(
        service.assertCanCreate('product', COMPANY_ID, 0),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
