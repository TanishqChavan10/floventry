import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { CompanySettings } from '../company/company-settings.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { GoodsReceiptNote } from '../inventory/entities/goods-receipt-note.entity';
import { IssueNote } from '../issues/entities/issue-note.entity';
import { WarehouseTransfer } from '../inventory/entities/warehouse-transfer.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Category } from '../inventory/entities/category.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import {
  GlobalSearchDocument,
  GlobalSearchDocumentType,
  GlobalSearchPurchaseOrder,
  GlobalSearchSalesOrder,
  GlobalSearchResponse,
} from './global-search.types';
import { Role } from '../auth/enums/role.enum';

const MAX_PER_GROUP = 5;

type RoleLike = Role | string | null | undefined;

function toRole(value: RoleLike): Role | undefined {
  if (typeof value !== 'string') return undefined;
  const upper = value.toUpperCase();
  const validRoles = Object.values(Role) as string[];
  if (!validRoles.includes(upper)) return undefined;
  return upper as Role;
}

function normalizeQuery(raw: string): string {
  return (raw ?? '').trim();
}

function isPrivilegedForWarehouses(role: RoleLike): boolean {
  const r = toRole(role);
  return r === Role.OWNER || r === Role.ADMIN || r === Role.MANAGER;
}

function canSeeArchivedWarehouses(role: RoleLike): boolean {
  const r = toRole(role);
  return r === Role.OWNER || r === Role.ADMIN;
}

function canSearchDocuments(role: RoleLike): boolean {
  const r = toRole(role);
  return r === Role.OWNER || r === Role.ADMIN || r === Role.MANAGER;
}

@Injectable()
export class GlobalSearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(CompanySettings)
    private readonly companySettingsRepository: Repository<CompanySettings>,
    @InjectRepository(UserWarehouse)
    private readonly userWarehouseRepository: Repository<UserWarehouse>,
    @InjectRepository(GoodsReceiptNote)
    private readonly grnRepository: Repository<GoodsReceiptNote>,
    @InjectRepository(IssueNote)
    private readonly issueRepository: Repository<IssueNote>,
    @InjectRepository(WarehouseTransfer)
    private readonly transferRepository: Repository<WarehouseTransfer>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
  ) {}

  async globalSearch(params: {
    query: string;
    companyId: string;
    userId: string;
    role?: string;
  }): Promise<GlobalSearchResponse> {
    const q = normalizeQuery(params.query);

    if (!q || q.length < 2) {
      return {
        products: [],
        warehouses: [],
        documents: [],
        suppliers: [],
        categories: [],
        purchaseOrders: [],
        salesOrders: [],
      };
    }

    const [products, warehouses, documents, suppliers, categories, purchaseOrders, salesOrders] =
      await Promise.all([
        this.searchProducts({
          companyId: params.companyId,
          query: q,
          role: params.role,
        }),
        this.searchWarehouses({
          companyId: params.companyId,
          query: q,
          userId: params.userId,
          role: params.role,
        }),
        this.searchDocuments({
          companyId: params.companyId,
          query: q,
          role: params.role,
        }),
        this.searchSuppliers({
          companyId: params.companyId,
          query: q,
        }),
        this.searchCategories({
          companyId: params.companyId,
          query: q,
        }),
        this.searchPurchaseOrders({
          companyId: params.companyId,
          query: q,
          role: params.role,
        }),
        this.searchSalesOrders({
          companyId: params.companyId,
          query: q,
        }),
      ]);

    return { products, warehouses, documents, suppliers, categories, purchaseOrders, salesOrders };
  }

  private async isPremiumCompany(companyId: string): Promise<boolean> {
    const settings = await this.companySettingsRepository.findOne({
      where: { company_id: companyId },
    });
    return Boolean(settings?.is_premium);
  }

  private async searchProducts(params: {
    companyId: string;
    query: string;
    role?: string;
  }): Promise<Product[]> {
    const isPremium = await this.isPremiumCompany(params.companyId);

    const qb = this.productRepository
      .createQueryBuilder('p')
      .where('p.company_id = :companyId', { companyId: params.companyId })
      .andWhere('p.is_active = true')
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('p.name ILIKE :q', { q: `%${params.query}%` })
            .orWhere('p.sku ILIKE :q', { q: `%${params.query}%` });

          if (isPremium) {
            sub.orWhere('p.barcode ILIKE :q', { q: `%${params.query}%` });

            // Alternate barcodes are stored as a text[] in Postgres.
            // Use unnest() to allow ILIKE (partial match) search.
            sub.orWhere(
              'EXISTS (SELECT 1 FROM unnest(p.alternate_barcodes) AS ab WHERE ab ILIKE :q)',
              { q: `%${params.query}%` },
            );
          }
        }),
      )
      .orderBy('p.created_at', 'DESC')
      .take(MAX_PER_GROUP);

    const items = await qb.getMany();

    // Do not leak barcode values to non-premium companies
    if (!isPremium) {
      return items.map((p) => ({ ...p, barcode: null }));
    }

    return items;
  }

  private async searchWarehouses(params: {
    companyId: string;
    query: string;
    userId: string;
    role?: string;
  }): Promise<Warehouse[]> {
    const role = toRole(params.role);

    // STAFF: only assigned warehouses (active only)
    if (role === Role.STAFF) {
      const qb = this.warehouseRepository
        .createQueryBuilder('w')
        .innerJoin(
          UserWarehouse,
          'uw',
          'uw.warehouse_id = w.id AND uw.user_id = :userId',
          {
            userId: params.userId,
          },
        )
        .where('w.company_id = :companyId', { companyId: params.companyId })
        .andWhere('w.deleted_at IS NULL')
        .andWhere("w.status = 'active'")
        .andWhere(
          new Brackets((sub) => {
            sub
              .where('w.name ILIKE :q', { q: `%${params.query}%` })
              .orWhere('w.code ILIKE :q', { q: `%${params.query}%` });
          }),
        )
        .orderBy('w.created_at', 'ASC')
        .take(MAX_PER_GROUP);

      return qb.getMany();
    }

    // MANAGER: active only
    if (role === Role.MANAGER) {
      const qb = this.warehouseRepository
        .createQueryBuilder('w')
        .where('w.company_id = :companyId', { companyId: params.companyId })
        .andWhere('w.deleted_at IS NULL')
        .andWhere("w.status = 'active'")
        .andWhere(
          new Brackets((sub) => {
            sub
              .where('w.name ILIKE :q', { q: `%${params.query}%` })
              .orWhere('w.code ILIKE :q', { q: `%${params.query}%` });
          }),
        )
        .orderBy('w.created_at', 'ASC')
        .take(MAX_PER_GROUP);

      return qb.getMany();
    }

    // ADMIN/OWNER: include archived (inactive + soft deleted)
    if (canSeeArchivedWarehouses(role)) {
      const qb = this.warehouseRepository
        .createQueryBuilder('w')
        .withDeleted()
        .where('w.company_id = :companyId', { companyId: params.companyId })
        .andWhere(
          new Brackets((sub) => {
            sub
              .where('w.name ILIKE :q', { q: `%${params.query}%` })
              .orWhere('w.code ILIKE :q', { q: `%${params.query}%` });
          }),
        )
        .orderBy('w.created_at', 'ASC')
        .take(MAX_PER_GROUP);

      return qb.getMany();
    }

    // Unknown/other roles: safest default
    if (!isPrivilegedForWarehouses(role)) {
      return [];
    }

    return [];
  }

  private async searchDocuments(params: {
    companyId: string;
    query: string;
    role?: string;
  }): Promise<GlobalSearchDocument[]> {
    if (!canSearchDocuments(params.role)) {
      return [];
    }

    const [grns, issues, transfers] = await Promise.all([
      this.grnRepository
        .createQueryBuilder('g')
        .where('g.company_id = :companyId', { companyId: params.companyId })
        .andWhere('g.grn_number ILIKE :q', { q: `%${params.query}%` })
        .orderBy('g.created_at', 'DESC')
        .take(MAX_PER_GROUP)
        .getMany(),
      this.issueRepository
        .createQueryBuilder('i')
        .where('i.company_id = :companyId', { companyId: params.companyId })
        .andWhere('i.issue_number ILIKE :q', { q: `%${params.query}%` })
        .orderBy('i.created_at', 'DESC')
        .take(MAX_PER_GROUP)
        .getMany(),
      this.transferRepository
        .createQueryBuilder('t')
        .where('t.company_id = :companyId', { companyId: params.companyId })
        .andWhere('t.transfer_number ILIKE :q', { q: `%${params.query}%` })
        .orderBy('t.created_at', 'DESC')
        .take(MAX_PER_GROUP)
        .getMany(),
    ]);

    type GlobalSearchDocumentWithCreatedAt = GlobalSearchDocument & {
      _createdAt: Date;
    };

    const merged: GlobalSearchDocumentWithCreatedAt[] = [];

    for (const g of grns) {
      merged.push({
        id: g.id,
        type: GlobalSearchDocumentType.GRN,
        number: g.grn_number,
        _createdAt: g.created_at,
      });
    }
    for (const i of issues) {
      merged.push({
        id: i.id,
        type: GlobalSearchDocumentType.ISSUE,
        number: i.issue_number,
        _createdAt: i.created_at,
      });
    }
    for (const t of transfers) {
      merged.push({
        id: t.id,
        type: GlobalSearchDocumentType.TRANSFER,
        number: t.transfer_number,
        _createdAt: t.created_at,
      });
    }

    merged.sort((a, b) => b._createdAt.getTime() - a._createdAt.getTime());

    return merged.slice(0, MAX_PER_GROUP).map((doc) => ({
      id: doc.id,
      type: doc.type,
      number: doc.number,
    }));
  }

  // ── Suppliers ──────────────────────────────────────────────────────────

  private async searchSuppliers(params: {
    companyId: string;
    query: string;
  }): Promise<Supplier[]> {
    return this.supplierRepository
      .createQueryBuilder('s')
      .where('s.company_id = :companyId', { companyId: params.companyId })
      .andWhere('s.isActive = true')
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('s.name ILIKE :q', { q: `%${params.query}%` })
            .orWhere('s.email ILIKE :q', { q: `%${params.query}%` })
            .orWhere('s.phone ILIKE :q', { q: `%${params.query}%` });
        }),
      )
      .orderBy('s.created_at', 'DESC')
      .take(MAX_PER_GROUP)
      .getMany();
  }

  // ── Categories ─────────────────────────────────────────────────────────

  private async searchCategories(params: {
    companyId: string;
    query: string;
  }): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('c')
      .where('c.company_id = :companyId', { companyId: params.companyId })
      .andWhere('c.isActive = true')
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('c.name ILIKE :q', { q: `%${params.query}%` })
            .orWhere('c.description ILIKE :q', { q: `%${params.query}%` });
        }),
      )
      .orderBy('c.name', 'ASC')
      .take(MAX_PER_GROUP)
      .getMany();
  }

  // ── Purchase Orders ────────────────────────────────────────────────────

  private async searchPurchaseOrders(params: {
    companyId: string;
    query: string;
    role?: string;
  }): Promise<GlobalSearchPurchaseOrder[]> {
    // POs are only visible to Owner / Admin / Manager
    if (!canSearchDocuments(params.role)) {
      return [];
    }

    const pos = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.company_id = :companyId', { companyId: params.companyId })
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('po.po_number ILIKE :q', { q: `%${params.query}%` })
            .orWhere('supplier.name ILIKE :q', { q: `%${params.query}%` });
        }),
      )
      .orderBy('po.created_at', 'DESC')
      .take(MAX_PER_GROUP)
      .getMany();

    return pos.map((po) => ({
      id: po.id,
      po_number: po.po_number,
      status: po.status,
      supplier_name: po.supplier?.name ?? undefined,
    }));
  }

  // ── Sales Orders ───────────────────────────────────────────────────────

  private async searchSalesOrders(params: {
    companyId: string;
    query: string;
  }): Promise<GlobalSearchSalesOrder[]> {
    const orders = await this.salesOrderRepository
      .createQueryBuilder('so')
      .where('so.company_id = :companyId', { companyId: params.companyId })
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('so.order_number ILIKE :q', { q: `%${params.query}%` })
            .orWhere('so.customer_name ILIKE :q', { q: `%${params.query}%` });
        }),
      )
      .orderBy('so.created_at', 'DESC')
      .take(MAX_PER_GROUP)
      .getMany();

    return orders.map((so) => ({
      id: so.id,
      order_number: so.order_number,
      status: so.status,
      customer_name: so.customer_name,
    }));
  }
}
