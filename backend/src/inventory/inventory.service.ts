import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThan,
  DataSource,
  In,
  MoreThan,
} from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockLot, LotSourceType } from './stock-lot/entities/stock-lot.entity';
import {
  StockMovement,
  MovementType,
  ReferenceType,
} from './entities/stock-movement.entity';
import { CreateCategoryInput, UpdateCategoryInput } from './dto/category.input';
import { CreateProductInput, UpdateProductInput } from './dto/product.input';
import { CreateUnitInput, UpdateUnitInput } from './dto/unit.input';
import {
  CreateStockInput,
  UpdateStockInput,
  AdjustStockInput,
  StockMovementFilterInput,
  CreateOpeningStockInput,
} from './dto/stock.input';
import {
  CreateStockLotInput,
  UpdateStockLotQuantityInput,
  StockLotFilterInput,
} from './stock-lot/dto/stock-lot.input';
import { UpdateStockThresholdsInput } from './dto/stock-health.input';
import {
  CreateInventoryAdjustmentInput,
  AdjustmentType,
} from './adjustment/dto/adjustment.input';
import { Warehouse } from '../warehouse/warehouse.entity';
import {
  StockHealthItem,
  StockHealthStatus,
  calculateStockHealthStatus,
} from './types/stock-health.types';
import { ExpiryStatus, StockLotWithStatus } from './types/expiry-status.types';
import {
  endOfDayUtcFromNowPlusDays,
  isExpiryInPastEndOfDay,
  normalizeExpiryToEndOfDayUTC,
} from '../common/utils/expiry-date';
import {
  CompanyInventorySummaryItem,
  InventoryHealthStats,
  TopStockProduct,
  CriticalStockProduct,
  WarehouseStockDistribution,
  WarehouseHealthScore,
  MovementTrendData,
  MovementTypeBreakdown,
  AdjustmentTrendData,
  AdjustmentByWarehouse,
  AdjustmentByUser,
  WarehouseHealthSummary,
  CompanyStockHealthOverview,
  WarehouseRiskMetric,
} from './types/company-inventory.types';
import { CompanyInventorySummaryFilterInput } from './dto/stock.input';
import { StockHealthService } from './stock-health/stock-health.service';
import { StockHealthState } from './stock-health/stock-health.types';
import {
  calculateUsableStock,
  determineStockHealthState,
} from './stock-health/stock-health.utils';
import { BarcodeService } from './barcode/barcode.service';
import { BarcodeFormatService } from './barcode/barcode-format.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntityType } from '../audit/enums/audit.enums';
import { NotificationsService } from '../notifications/notifications.service';
import { BarcodeHistory, BarcodeHistoryChangeType } from './barcode/entities/barcode-history.entity';
import { ProductBarcodeUnit, ProductBarcodeUnitType } from './barcode/entities/product-barcode-unit.entity';
import { UpsertProductBarcodeUnitInput } from './barcode/dto/product-barcode-unit.input';
import { PaginationInput, PageInfo, CursorPaginationInput, encodeCursor, decodeCursor } from '../common/dto/pagination.types';
import { ILike } from 'typeorm';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly barcodeService: BarcodeService,
    @InjectRepository(BarcodeHistory)
    private readonly barcodeHistoryRepository: Repository<BarcodeHistory>,
    @InjectRepository(ProductBarcodeUnit)
    private readonly productBarcodeUnitRepository: Repository<ProductBarcodeUnit>,
    @InjectRepository(Unit)
    private unitRepository: Repository<Unit>,
    private readonly stockHealthService: StockHealthService,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockLot)
    private stockLotRepository: Repository<StockLot>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectDataSource()
    private dataSource: DataSource,
    private readonly barcodeFormatService: BarcodeFormatService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) { }

  // --- Packaging/Multi-unit barcodes ---

  async getProductBarcodeUnits(params: {
    companyId: string;
    productId: string;
  }): Promise<ProductBarcodeUnit[]> {
    return this.productBarcodeUnitRepository.find({
      where: { company_id: params.companyId, product_id: params.productId },
      order: { created_at: 'DESC' },
    });
  }

  async upsertProductBarcodeUnit(params: {
    companyId: string;
    input: UpsertProductBarcodeUnitInput;
  }): Promise<ProductBarcodeUnit> {
    const product = await this.productRepository.findOne({
      where: { id: params.input.product_id, company_id: params.companyId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const normalized = this.barcodeService.normalizeBarcode(params.input.barcode_value);
    if (!normalized) {
      throw new BadRequestException('Barcode is required');
    }

    const primary = this.barcodeService.normalizeBarcode(product.barcode) ?? null;
    const alternates = Array.isArray((product as any).alternate_barcodes)
      ? ((product as any).alternate_barcodes as any[])
        .map((v) => (typeof v === 'string' ? this.barcodeService.normalizeBarcode(v) : null))
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
      : [];

    if (primary && primary === normalized) {
      throw new BadRequestException('Packaging barcode cannot equal the primary product barcode');
    }

    if (alternates.includes(normalized)) {
      throw new BadRequestException('Packaging barcode cannot equal an alternate product barcode');
    }

    await this.barcodeService.assertCompanyBarcodeUniqueness({
      companyId: params.companyId,
      barcodes: [normalized],
      excludeProductId: product.id,
      excludeBarcodeUnitId: params.input.id,
    });

    let entity: ProductBarcodeUnit;

    if (params.input.id) {
      const existing = await this.productBarcodeUnitRepository.findOne({
        where: { id: params.input.id, company_id: params.companyId },
      });
      if (!existing) {
        throw new NotFoundException('Packaging barcode unit not found');
      }
      if (existing.product_id !== params.input.product_id) {
        throw new ForbiddenException('Cannot move barcode unit between products');
      }

      entity = this.productBarcodeUnitRepository.merge(existing, {
        barcode_value: normalized,
        unit_type: params.input.unit_type,
        quantity_multiplier: params.input.quantity_multiplier,
        is_primary: params.input.is_primary,
      });
    } else {
      entity = this.productBarcodeUnitRepository.create({
        company_id: params.companyId,
        product_id: params.input.product_id,
        barcode_value: normalized,
        unit_type: params.input.unit_type,
        quantity_multiplier: params.input.quantity_multiplier,
        is_primary: params.input.is_primary,
      });
    }

    if (entity.is_primary) {
      await this.productBarcodeUnitRepository.update(
        { company_id: params.companyId, product_id: entity.product_id },
        { is_primary: false },
      );
    }

    return this.productBarcodeUnitRepository.save(entity);
  }

  async removeProductBarcodeUnit(params: {
    companyId: string;
    id: string;
  }): Promise<boolean> {
    const existing = await this.productBarcodeUnitRepository.findOne({
      where: { id: params.id, company_id: params.companyId },
    });
    if (!existing) {
      throw new NotFoundException('Packaging barcode unit not found');
    }

    await this.productBarcodeUnitRepository.remove(existing);
    return true;
  }

  // --- Categories ---

  async createCategory(
    input: CreateCategoryInput,
    companyId: string,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...input,
      company_id: companyId,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(companyId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { company_id: companyId },
      order: { name: 'ASC' },
      relations: ['products'], // Optional: load products count or list?
    });
  }

  async findOneCategory(id: string, companyId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(
    input: UpdateCategoryInput,
    companyId: string,
  ): Promise<Category> {
    const category = await this.findOneCategory(input.id, companyId);
    Object.assign(category, input);
    // Restoring category when updating
    category.isActive = true;
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string, companyId: string): Promise<boolean> {
    // Soft delete: set isActive = false instead of hard delete
    const category = await this.categoryRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Update to inactive instead of deleting
    category.isActive = false;
    await this.categoryRepository.save(category);

    return true;
  }

  // --- Products ---

  async createProduct(
    input: CreateProductInput,
    companyId: string,
  ): Promise<Product> {
    const barcodeRaw =
      typeof input?.barcode === 'string' && input.barcode.trim().length > 0
        ? input.barcode
        : null;

    const generatedBarcode =
      barcodeRaw === null
        ? await this.barcodeFormatService.generateNextCompanyBarcode(companyId)
        : null;

    const normalized = await this.barcodeService.normalizeAndValidateForCompany(
      {
        companyId,
        barcode: generatedBarcode ?? barcodeRaw,
        alternateBarcodes: (input as any).alternate_barcodes,
      },
    );

    const product = this.productRepository.create({
      ...input,
      ...normalized,
      company_id: companyId,
    });
    return this.productRepository.save(product);
  }

  async generateCompanyBarcode(companyId: string): Promise<string> {
    return this.barcodeFormatService.generateNextCompanyBarcode(companyId);
  }

  async findAllProducts(companyId: string): Promise<Product[]> {
    // Eager load category and supplier
    return this.productRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
      relations: ['category', 'supplier'],
    });
  }

  async findAllProductsPaginated(
    companyId: string,
    pagination?: PaginationInput,
  ): Promise<{ items: Product[]; pageInfo: PageInfo }> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { company_id: companyId };

    if (pagination?.search) {
      where.name = ILike(`%${pagination.search}%`);
    }

    const [items, total] = await this.productRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      relations: ['category', 'supplier'],
      take: limit,
      skip,
    });

    return {
      items,
      pageInfo: {
        total,
        page,
        limit,
        hasNextPage: skip + items.length < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findProductsConnection(
    companyId: string,
    input?: CursorPaginationInput,
  ) {
    const first = Math.min(input?.first || 20, 100);
    const offset = input?.after ? decodeCursor(input.after) + 1 : 0;

    const where: any = { company_id: companyId };
    if (input?.search) {
      where.name = ILike(`%${input.search}%`);
    }

    const [items, totalCount] = await this.productRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      relations: ['category', 'supplier'],
      take: first,
      skip: offset,
    });

    const edges = items.map((node, i) => ({
      node,
      cursor: encodeCursor(offset + i),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: offset + items.length < totalCount,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        totalCount,
      },
    };
  }

  async findOneProduct(id: string, companyId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['category', 'supplier'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async updateProduct(
    input: UpdateProductInput,
    companyId: string,
    changedByUserId?: string,
  ): Promise<Product> {
    const product = await this.findOneProduct(input.id, companyId);

    const prevBarcode = product.barcode ?? null;
    const prevAlternate = Array.isArray((product as any).alternate_barcodes)
      ? ((product as any).alternate_barcodes as string[])
      : null;

    const barcodeCandidateRaw =
      input.barcode !== undefined ? input.barcode : product.barcode;

    const nextBarcodeRaw =
      typeof barcodeCandidateRaw === 'string'
        ? barcodeCandidateRaw.trim().length > 0
          ? barcodeCandidateRaw
          : null
        : barcodeCandidateRaw ?? null;

    const ensuredBarcode =
      nextBarcodeRaw === null
        ? await this.barcodeFormatService.generateNextCompanyBarcode(companyId)
        : nextBarcodeRaw;
    const nextAlternateRaw =
      (input as any).alternate_barcodes !== undefined
        ? (input as any).alternate_barcodes
        : product.alternate_barcodes;

    const normalized = await this.barcodeService.normalizeAndValidateForCompany(
      {
        companyId,
        barcode: ensuredBarcode,
        alternateBarcodes: nextAlternateRaw,
        excludeProductId: product.id,
      },
    );

    Object.assign(product, input);
    Object.assign(product, normalized);
    // Restoring product when updating
    product.is_active = true;

    const saved = await this.productRepository.save(product);

    // --- Barcode history ---
    const savedBarcode = saved.barcode ?? null;
    const savedAlternate = Array.isArray((saved as any).alternate_barcodes)
      ? ((saved as any).alternate_barcodes as string[])
      : null;

    if (prevBarcode !== savedBarcode) {
      await this.barcodeHistoryRepository.save(
        this.barcodeHistoryRepository.create({
          company_id: companyId,
          product_id: saved.id,
          change_type: BarcodeHistoryChangeType.PRIMARY_CHANGED,
          old_value: prevBarcode,
          new_value: savedBarcode,
          changed_by_user_id: changedByUserId ?? null,
          reason: null,
        }),
      );
    }

    const prevList = (prevAlternate ?? []).filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    );
    const nextList = (savedAlternate ?? []).filter(
      (v): v is string => typeof v === 'string' && v.trim().length > 0,
    );

    const prevSet = new Set<string>(prevList);
    const nextSet = new Set<string>(nextList);

    for (const added of Array.from(nextSet)) {
      if (!prevSet.has(added)) {
        await this.barcodeHistoryRepository.save(
          this.barcodeHistoryRepository.create({
            company_id: companyId,
            product_id: saved.id,
            change_type: BarcodeHistoryChangeType.ALTERNATE_ADDED,
            old_value: null,
            new_value: added,
            changed_by_user_id: changedByUserId ?? null,
            reason: null,
          }),
        );
      }
    }

    for (const removed of Array.from(prevSet)) {
      if (!nextSet.has(removed)) {
        await this.barcodeHistoryRepository.save(
          this.barcodeHistoryRepository.create({
            company_id: companyId,
            product_id: saved.id,
            change_type: BarcodeHistoryChangeType.ALTERNATE_REMOVED,
            old_value: removed,
            new_value: null,
            changed_by_user_id: changedByUserId ?? null,
            reason: null,
          }),
        );
      }
    }

    return saved;
  }

  async findProductByBarcode(
    barcode: string,
    companyId: string,
  ): Promise<Product> {
    return this.barcodeService.findProductByBarcode({ companyId, barcode });
  }

  async findProductByBarcodeDetails(params: {
    barcode: string;
    companyId: string;
  }): Promise<{
    product: Product;
    barcode_value: string;
    unit_type: ProductBarcodeUnitType;
    quantity_multiplier: number;
  }> {
    const resolved = await this.barcodeService.resolveBarcodeWithUnit({
      companyId: params.companyId,
      barcode: params.barcode,
    });

    if (!resolved) {
      throw new NotFoundException('Barcode not found');
    }

    return {
      product: resolved.product,
      barcode_value: resolved.barcode_value,
      unit_type: resolved.unit_type as unknown as ProductBarcodeUnitType,
      quantity_multiplier: resolved.quantity_multiplier,
    };
  }



  async getBarcodeHistory(params: {
    companyId: string;
    productId: string;
  }): Promise<BarcodeHistory[]> {
    return this.barcodeHistoryRepository.find({
      where: { company_id: params.companyId, product_id: params.productId },
      order: { changed_at: 'DESC' },
    });
  }

  async removeProduct(id: string, companyId: string): Promise<boolean> {
    // Soft delete: set is_active = false instead of hard delete
    const product = await this.productRepository.findOne({
      where: { id, company_id: companyId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Update to inactive instead of deleting
    product.is_active = false;
    await this.productRepository.save(product);

    return true;
  }

  // --- Units ---

  async createUnit(input: any, companyId: string): Promise<Unit> {
    if (input.isDefault) {
      await this.unitRepository.update(
        { company_id: companyId },
        { isDefault: false },
      );
    }
    const unit: Unit = this.unitRepository.create({
      ...input,
      company_id: companyId,
      isActive: true,
    } as unknown as Unit);
    return this.unitRepository.save(unit);
  }

  async findAllUnits(companyId: string, includeArchived = false): Promise<Unit[]> {
    return this.unitRepository.find({
      where: includeArchived
        ? { company_id: companyId }
        : { company_id: companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async updateUnit(input: any, companyId: string): Promise<Unit> {
    const unit = await this.unitRepository.findOne({
      where: { id: input.id, company_id: companyId },
    });
    if (!unit) throw new NotFoundException(`Unit not found`);

    if (input.isDefault) {
      await this.unitRepository.update(
        { company_id: companyId },
        { isDefault: false },
      );
    }

    Object.assign(unit, input);
    return this.unitRepository.save(unit);
  }

  async removeUnit(id: string, companyId: string): Promise<boolean> {
    const unit = await this.unitRepository.findOne({
      where: { id, company_id: companyId },
    });
    if (!unit) throw new NotFoundException(`Unit not found`);

    unit.isActive = false;
    unit.isDefault = false;
    await this.unitRepository.save(unit);
    return true;
  }

  // --- Stock Management ---

  /**
   * Phase 1: Create opening stock for a product in a warehouse
   * This is the entry point for initial stock setup
   */
  async createOpeningStock(
    input: CreateOpeningStockInput,
    companyId: string,
    userId: string,
    userRole?: string,
  ): Promise<Stock> {
    if (input.expiry_date && isExpiryInPastEndOfDay(input.expiry_date)) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if stock already exists for this product in this warehouse
      const existing = await queryRunner.manager.findOne(Stock, {
        where: {
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          company_id: companyId,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Opening stock already exists for this product in this warehouse. Use adjust stock instead.',
        );
      }

      // Verify product belongs to the company and is active
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: input.product_id, company_id: companyId, is_active: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }

      // Create stock aggregate record
      const stock = queryRunner.manager.create(Stock, {
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        company_id: companyId,
        quantity: input.quantity,
        min_stock_level: input.min_stock_level,
        max_stock_level: input.max_stock_level,
        reorder_point: input.reorder_point,
      });

      const savedStock = await queryRunner.manager.save(Stock, stock);

      // Create opening stock lot (expiry lives here)
      const lotData: any = {
        company_id: companyId,
        warehouse_id: input.warehouse_id,
        product_id: input.product_id,
        quantity: input.quantity,
        received_at: new Date(),
        source_type: LotSourceType.OPENING,
        source_id: null,
      };

      if (input.expiry_date) {
        lotData.expiry_date = normalizeExpiryToEndOfDayUTC(input.expiry_date);
      }

      const lot = queryRunner.manager.create(StockLot, lotData);

      await queryRunner.manager.save(StockLot, lot);

      // Opening stock is baseline: do NOT create StockMovement

      await queryRunner.commitTransaction();

      const stockWithRelations = await this.stockRepository.findOne({
        where: { id: savedStock.id },
        relations: ['product', 'warehouse'],
      });

      if (!stockWithRelations) {
        throw new BadRequestException('Failed to load stock after creation');
      }

      await this.auditLogService.record({
        companyId,
        actor: { id: userId, email: '', role: userRole || 'STAFF' },
        action: AuditAction.OPENING_STOCK_SET,
        entityType: AuditEntityType.OPENING_STOCK,
        entityId: savedStock.id,
        metadata: {
          productName: stockWithRelations.product?.name,
          sku: stockWithRelations.product?.sku,
          warehouseName: stockWithRelations.warehouse?.name,
          quantity: input.quantity,
        },
      });

      return stockWithRelations;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createStock(
    input: CreateStockInput,
    companyId: string,
    userId: string,
  ): Promise<Stock> {
    // Check if stock already exists for this product in this warehouse
    const existing = await this.stockRepository.findOne({
      where: {
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Stock already exists for this product in this warehouse',
      );
    }

    // Verify product belongs to the company
    const product = await this.productRepository.findOne({
      where: { id: input.product_id, company_id: companyId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const stock = this.stockRepository.create({
      ...input,
      company_id: companyId,
    });

    const savedStock = await this.stockRepository.save(stock);

    // Create initial movement record if quantity > 0
    if (input.quantity && input.quantity > 0) {
      await this.stockMovementRepository.save({
        stock_id: savedStock.id,
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        company_id: companyId,
        type: MovementType.IN,
        quantity: input.quantity,
        previous_quantity: 0,
        new_quantity: input.quantity,
        reason: 'Initial stock',
        performed_by: userId,
      });
    }

    return savedStock;
  }

  async getStock(
    productId: string,
    warehouseId: string,
    companyId: string,
  ): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: {
        product_id: productId,
        warehouse_id: warehouseId,
        company_id: companyId,
      },
      relations: ['product', 'warehouse'],
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async getStockByWarehouse(
    warehouseId: string,
    companyId: string,
    limit?: number,
    offset?: number,
  ): Promise<Stock[]> {
    return this.stockRepository.find({
      where: {
        warehouse_id: warehouseId,
        company_id: companyId,
      },
      relations: [
        'product',
        'product.category',
        'product.supplier',
        'warehouse',
      ],
      order: { updated_at: 'DESC' },
      take: limit || 50,
      skip: offset || 0,
    });
  }

  async getLotsForStock(
    stock: Pick<Stock, 'company_id' | 'product_id' | 'warehouse_id'>,
  ): Promise<StockLot[]> {
    return this.stockLotRepository.find({
      where: {
        company_id: stock.company_id,
        product_id: stock.product_id,
        warehouse_id: stock.warehouse_id,
      },
      order: {
        expiry_date: 'ASC',
        received_at: 'ASC',
      },
    });
  }

  async getStockByProduct(
    productId: string,
    companyId: string,
  ): Promise<Stock[]> {
    return this.stockRepository.find({
      where: {
        product_id: productId,
        company_id: companyId,
      },
      relations: ['product', 'warehouse'],
    });
  }

  async getAllStock(
    companyId: string,
    limit?: number,
    offset?: number,
  ): Promise<Stock[]> {
    return this.stockRepository.find({
      where: { company_id: companyId },
      relations: ['product', 'warehouse'],
      order: { updated_at: 'DESC' },
      take: limit || 50,
      skip: offset || 0,
    });
  }

  async updateStockLevels(
    input: UpdateStockInput,
    companyId: string,
  ): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { id: input.id, company_id: companyId },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    Object.assign(stock, {
      min_stock_level: input.min_stock_level ?? stock.min_stock_level,
      max_stock_level: input.max_stock_level ?? stock.max_stock_level,
      reorder_point: input.reorder_point ?? stock.reorder_point,
    });

    return this.stockRepository.save(stock);
  }

  async adjustStock(
    input: AdjustStockInput,
    companyId: string,
    userId: string,
    userRole?: string,
  ): Promise<Stock> {
    // Find or create stock record
    const stock = await this.stockRepository.findOne({
      where: {
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        company_id: companyId,
      },
    });

    if (!stock) {
      // For Phase 1, require opening stock to exist first
      throw new BadRequestException(
        'Stock record not found. Please create opening stock first.',
      );
    }

    const previousQuantity = Number(stock.quantity);
    const newQuantity = previousQuantity + Number(input.quantity);

    if (newQuantity < 0) {
      throw new BadRequestException(
        'Insufficient stock. Cannot reduce below zero.',
      );
    }

    // Determine movement type based on quantity direction
    let movementType = input.type;
    if (input.quantity > 0 && input.type === MovementType.ADJUSTMENT) {
      movementType = MovementType.ADJUSTMENT_IN;
    } else if (input.quantity < 0 && input.type === MovementType.ADJUSTMENT) {
      movementType = MovementType.ADJUSTMENT_OUT;
    }

    // Update stock quantity
    stock.quantity = newQuantity;
    const updatedStock = await this.stockRepository.save(stock);

    // Create adjustment lot
    const adjustmentLot = this.stockLotRepository.create({
      company_id: companyId,
      warehouse_id: input.warehouse_id,
      product_id: input.product_id,
      quantity: input.quantity,
      received_at: new Date(),
      source_type: LotSourceType.ADJUSTMENT,
      source_id: null, // No specific source for adjustments
    });
    await this.stockLotRepository.save(adjustmentLot);

    // Create movement record
    await this.stockMovementRepository.save({
      stock_id: stock.id,
      lot_id: adjustmentLot.id, // Link to the adjustment lot
      product_id: input.product_id,
      warehouse_id: input.warehouse_id,
      company_id: companyId,
      type: movementType,
      quantity: input.quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reason:
        input.reason ||
        (input.quantity > 0
          ? 'Stock adjustment (increase)'
          : 'Stock adjustment (decrease)'),
      reference_id: input.reference_id || undefined,
      reference_type: input.reference_type,
      performed_by: userId,
      user_role: userRole,
      notes: input.notes || undefined,
    });

    // Return stock with relations loaded
    const stockWithRelations = await this.stockRepository.findOne({
      where: { id: updatedStock.id },
      relations: ['product', 'warehouse'],
    });

    if (!stockWithRelations) {
      throw new BadRequestException('Failed to load stock after adjustment');
    }

    await this.auditLogService.record({
      companyId,
      actor: { id: userId, email: '', role: userRole || 'STAFF' },
      action: AuditAction.ADJUSTMENT_CREATED,
      entityType: AuditEntityType.ADJUSTMENT,
      entityId: updatedStock.id,
      metadata: {
        productName: stockWithRelations.product?.name,
        sku: stockWithRelations.product?.sku,
        warehouseName: stockWithRelations.warehouse?.name,
        previousQuantity,
        adjustedBy: input.quantity,
        newQuantity,
        reason: input.reason,
      },
    });

    return stockWithRelations;
  }

  /**
   * Create inventory adjustment for stock correction
   * Uses atomic operations and strict validation
   * ADJUSTMENT_OUT requires existing stock
   */
  async createInventoryAdjustment(
    input: CreateInventoryAdjustmentInput,
    companyId: string,
    userId: string,
    userRole?: string,
  ): Promise<{ success: boolean; stockMovement: StockMovement; stock: Stock }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Validate warehouse belongs to company
      const warehouse = await queryRunner.manager.findOne(Warehouse, {
        where: { id: input.warehouse_id, company_id: companyId },
      });

      if (!warehouse) {
        throw new BadRequestException(
          'Warehouse not found or does not belong to your company',
        );
      }

      // Step 2: Find stock record
      let stock = await queryRunner.manager.findOne(Stock, {
        where: {
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          company_id: companyId,
        },
      });

      const adjustmentQty = Math.floor(Number(input.quantity));
      const previousQty = stock ? Math.floor(Number(stock.quantity)) : 0;

      // Step 3: Strict validation for ADJUSTMENT_OUT
      if (input.adjustment_type === AdjustmentType.OUT) {
        if (!stock) {
          throw new BadRequestException(
            "Stock record not found. Cannot reduce stock that doesn't exist.",
          );
        }
        if (previousQty < adjustmentQty) {
          throw new BadRequestException(
            `Insufficient stock.Available: ${previousQty}, Requested: ${adjustmentQty} `,
          );
        }
      }

      // Step 4: Create stock record if needed (ADJUSTMENT_IN only)
      if (!stock && input.adjustment_type === AdjustmentType.IN) {
        stock = queryRunner.manager.create(Stock, {
          product_id: input.product_id,
          warehouse_id: input.warehouse_id,
          company_id: companyId,
          quantity: 0,
          min_stock_level: 0,
          max_stock_level: 1000,
          reorder_point: 10,
        });
        await queryRunner.manager.save(Stock, stock);
      }

      // Step 5: Calculate new quantity
      const newQty =
        input.adjustment_type === AdjustmentType.IN
          ? previousQty + adjustmentQty
          : previousQty - adjustmentQty;

      // Step 6: Create adjustment lot
      const adjustmentLot = queryRunner.manager.create(StockLot, {
        company_id: companyId,
        warehouse_id: input.warehouse_id,
        product_id: input.product_id,
        quantity: input.adjustment_type === AdjustmentType.IN ? adjustmentQty : -adjustmentQty,
        received_at: new Date(),
        source_type: LotSourceType.ADJUSTMENT,
        source_id: null, // No specific source for adjustments
      });

      await queryRunner.manager.save(StockLot, adjustmentLot);

      // Step 7: Create stock movement (immutable audit record)
      const movementType =
        input.adjustment_type === AdjustmentType.IN
          ? MovementType.ADJUSTMENT_IN
          : MovementType.ADJUSTMENT_OUT;

      const movement = queryRunner.manager.create(StockMovement, {
        stock_id: stock!.id, // We know stock exists at this point
        lot_id: adjustmentLot.id, // Link to the adjustment lot
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        company_id: companyId,
        type: movementType,
        quantity: adjustmentQty,
        previous_quantity: previousQty,
        new_quantity: newQty,
        reason: input.reason,
        reference_id: input.reference || undefined,
        reference_type: ReferenceType.ADJUSTMENT,
        performed_by: userId,
        user_role: userRole,
      });

      await queryRunner.manager.save(StockMovement, movement);

      // Step 8: Update stock with ATOMIC operation (no .save())
      if (input.adjustment_type === AdjustmentType.IN) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Stock)
          .set({ quantity: newQty })
          .where('id = :id', { id: stock!.id })
          .execute();
      } else {
        // ADJUSTMENT_OUT with safety check
        await queryRunner.manager
          .createQueryBuilder()
          .update(Stock)
          .set({ quantity: newQty })
          .where('id = :id', { id: stock!.id })
          .andWhere('quantity >= :adjustmentQty', { adjustmentQty })
          .execute();
      }

      // Reload stock to get updated quantity
      stock!.quantity = newQty;

      await queryRunner.commitTransaction();

      // Return result with relations
      const stockWithRelations = await this.stockRepository.findOne({
        where: { id: stock!.id },
        relations: ['product', 'warehouse'],
      });

      if (!stockWithRelations) {
        throw new BadRequestException(
          'Failed to reload stock after adjustment',
        );
      }

      await this.auditLogService.record({
        companyId,
        actor: { id: userId, email: '', role: userRole || 'STAFF' },
        action: AuditAction.ADJUSTMENT_CREATED,
        entityType: AuditEntityType.ADJUSTMENT,
        entityId: stock!.id,
        metadata: {
          productName: stockWithRelations.product?.name,
          sku: stockWithRelations.product?.sku,
          warehouseName: stockWithRelations.warehouse?.name,
          adjustmentType: input.adjustment_type,
          previousQuantity: previousQty,
          adjustedBy: adjustmentQty,
          newQuantity: newQty,
          reason: input.reason,
          reference: input.reference,
        },
      });

      this.notificationsService
        .notifyAdjustmentPosted(
          companyId,
          stock!.id,
          stockWithRelations.product?.name || 'Unknown Product',
          input.warehouse_id,
          input.adjustment_type,
          adjustmentQty,
        )
        .catch((err) =>
          console.error('Failed to send adjustment notification', err),
        );

      return {
        success: true,
        stockMovement: movement,
        stock: stockWithRelations,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStockMovements(
    filters: StockMovementFilterInput,
    companyId: string,
  ): Promise<StockMovement[]> {
    const where: any = { company_id: companyId };

    if (filters.warehouse_id) {
      where.warehouse_id = filters.warehouse_id;
    }

    if (filters.product_id) {
      where.product_id = filters.product_id;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    // Support filtering by multiple types
    if (filters.types && filters.types.length > 0) {
      where.type = filters.type
        ? filters.type
        : filters.types.length === 1
          ? filters.types[0]
          : In(filters.types);
    }

    if (filters.from_date && filters.to_date) {
      where.created_at = Between(filters.from_date, filters.to_date);
    } else if (filters.from_date) {
      where.created_at = Between(filters.from_date, new Date());
    }

    return this.stockMovementRepository.find({
      where,
      relations: ['product', 'warehouse', 'user', 'stock'],
      order: { created_at: 'DESC' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Get stock movements with cursor-based pagination (relay-style)
   */
  async getStockMovementsConnection(
    companyId: string,
    input?: CursorPaginationInput,
  ) {
    const first = Math.min(input?.first || 20, 100);
    const offset = input?.after ? decodeCursor(input.after) + 1 : 0;

    const where: any = { company_id: companyId };

    const [items, totalCount] = await this.stockMovementRepository.findAndCount(
      {
        where,
        relations: ['product', 'warehouse', 'user', 'stock'],
        order: { created_at: 'DESC' },
        take: first,
        skip: offset,
      },
    );

    const edges = items.map((node, i) => ({
      node,
      cursor: encodeCursor(offset + i),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: offset + items.length < totalCount,
        endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        totalCount,
      },
    };
  }

  // --- Low Stock & Stock Health ---

  /**
   * Get low stock items for a warehouse
   * Returns only WARNING & CRITICAL items
   */
  async getLowStockItems(
    warehouseId: string,
    companyId: string,
    userRole?: string,
    userId?: string,
  ): Promise<StockHealthItem[]> {
    // Build query to find stock items that need attention
    const query = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.company_id = :companyId', { companyId })
      .andWhere('stock.warehouse_id = :warehouseId', { warehouseId })
      .andWhere(
        '(stock.quantity <= stock.reorder_point OR stock.quantity <= stock.min_stock_level)',
      )
      .andWhere(
        '(stock.reorder_point IS NOT NULL OR stock.min_stock_level IS NOT NULL)',
      ) // FIX: Wrapped in parentheses
      .orderBy('stock.quantity', 'ASC');

    const stocks = await query.getMany();

    // Map to StockHealthItem with computed status
    return stocks.map((stock) => {
      const status = calculateStockHealthStatus(
        stock.quantity,
        stock.min_stock_level,
        stock.reorder_point,
      );

      return {
        stockId: stock.id,
        product: stock.product,
        quantity: stock.quantity,
        minStockLevel: stock.min_stock_level,
        reorderPoint: stock.reorder_point,
        maxStockLevel: stock.max_stock_level,
        status,
      };
    });
  }

  async getStockValue(
    warehouseId: string | null,
    companyId: string,
  ): Promise<number> {
    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoin('stock.product', 'product')
      .select('SUM(stock.quantity * product.cost_price)', 'total_value')
      .where('stock.company_id = :companyId', { companyId });

    if (warehouseId) {
      queryBuilder.andWhere('stock.warehouse_id = :warehouseId', {
        warehouseId,
      });
    }

    const result = await queryBuilder.getRawOne();
    return parseFloat(result.total_value || 0);
  }

  /**
   * Update stock thresholds
   * Validates min <= reorder <= max
   */
  async updateStockThresholds(
    stockId: string,
    input: UpdateStockThresholdsInput,
    companyId: string,
    userId?: string,
    userRole?: string,
  ): Promise<Stock> {
    // Find stock with warehouse for RBAC check
    const stock = await this.stockRepository.findOne({
      where: { id: stockId, company_id: companyId },
      relations: ['warehouse', 'product'],
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    // RBAC: For MANAGER, verify warehouse assignment
    // This would require checking against user's managed warehouses
    // For now, we rely on the resolver to handle this check

    // Prepare new values (use existing if not provided)
    const newMin =
      input.min_stock_level !== undefined
        ? input.min_stock_level
        : stock.min_stock_level;
    const newReorder =
      input.reorder_point !== undefined
        ? input.reorder_point
        : stock.reorder_point;
    const newMax =
      input.max_stock_level !== undefined
        ? input.max_stock_level
        : stock.max_stock_level;

    // Validation: min <= reorder <= max
    if (newMin !== null && newReorder !== null && newMin > newReorder) {
      throw new BadRequestException(
        'Min stock level must be less than or equal to reorder point',
      );
    }

    if (newReorder !== null && newMax !== null && newReorder > newMax) {
      throw new BadRequestException(
        'Reorder point must be less than or equal to max stock level',
      );
    }

    if (newMin !== null && newMax !== null && newMin > newMax) {
      throw new BadRequestException(
        'Min stock level must be less than or equal to max stock level',
      );
    }

    // Update thresholds
    if (input.min_stock_level !== undefined) {
      stock.min_stock_level = input.min_stock_level;
    }
    if (input.reorder_point !== undefined) {
      stock.reorder_point = input.reorder_point;
    }
    if (input.max_stock_level !== undefined) {
      stock.max_stock_level = input.max_stock_level;
    }

    return this.stockRepository.save(stock);
  }

  /**
   * Get aggregated inventory summary for the company
   * Agregates stock across all warehouses
   */
  async getCompanyInventorySummary(
    filters: CompanyInventorySummaryFilterInput,
    companyId: string,
  ): Promise<CompanyInventorySummaryItem[]> {
    // 1. Build Query for Products
    const productQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.company_id = :companyId', { companyId })
      .andWhere('product.is_active = :isActive', { isActive: true });

    if (filters.categoryId) {
      productQuery.andWhere('product.category_id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.search) {
      productQuery.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Apply pagination on products
    productQuery
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .orderBy('product.name', 'ASC');

    const products = await productQuery.getMany();

    if (products.length === 0) {
      return [];
    }

    // 2. Fetch all stocks for these products
    const productIds = products.map((p) => p.id);
    const stockQuery = this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.product_id IN (:...productIds)', { productIds })
      .andWhere('stock.company_id = :companyId', { companyId }); // Ensure company scope

    if (filters.warehouseId) {
      stockQuery.andWhere('stock.warehouse_id = :warehouseId', {
        warehouseId: filters.warehouseId,
      });
    }

    const stocks = await stockQuery.getMany();

    // 3. Fetch all lots for these products to calculate usable quantities
    const allLots = await this.stockLotRepository.find({
      where: { product_id: In(productIds), company_id: companyId },
    });

    // Group lots by product for efficient lookup
    const lotsByProduct = new Map<string, StockLot[]>();
    allLots.forEach((lot) => {
      const existing = lotsByProduct.get(lot.product_id) || [];
      existing.push(lot);
      lotsByProduct.set(lot.product_id, existing);
    });

    const expiryWarningDays = 30; // Match stock health service default
    const excludeExpiringSoon = false; // Include expiring soon in usable calc

    // 4. Aggregate results
    const result: CompanyInventorySummaryItem[] = products.map((product) => {
      // Get all stocks for this product
      const productStocks = stocks.filter((s) => s.product_id === product.id);

      let totalQuantity = 0;
      let totalUsableQuantity = 0; // NEW: Total usable across all warehouses
      let warehouseCount = 0;
      let minQuantity = 0; // Across warehouses (for display/stats)
      let maxQuantity = 0;

      // Health Logic
      let isCritical = false;
      let isWarning = false;
      let worstStockHealthState = StockHealthState.HEALTHY; // NEW: Track worst state

      if (productStocks.length > 0) {
        // Initialize min/max with first item
        minQuantity = productStocks[0].quantity;
        maxQuantity = productStocks[0].quantity;

        warehouseCount = productStocks.length;

        const productLots = lotsByProduct.get(product.id) || [];

        // Calculate expiry data for product
        const now = new Date();
        const warningCutoff = endOfDayUtcFromNowPlusDays(
          expiryWarningDays,
          now,
        );
        let totalExpiredQty = 0;
        let totalExpiringSoonQty = 0;

        // Calculate expired and expiring soon quantities from lots
        productLots.forEach((lot) => {
          const qty =
            lot.quantity === null || lot.quantity === undefined
              ? 0
              : parseFloat(lot.quantity.toString());

          if (!lot.expiry_date || qty <= 0) return;

          if (isExpiryInPastEndOfDay(lot.expiry_date, now)) {
            totalExpiredQty += qty;
          } else if (
            normalizeExpiryToEndOfDayUTC(lot.expiry_date) <= warningCutoff
          ) {
            totalExpiringSoonQty += qty;
          }
        });

        productStocks.forEach((stock) => {
          const qty = Number(stock.quantity);
          totalQuantity += qty;

          if (qty < minQuantity) minQuantity = qty;
          if (qty > maxQuantity) maxQuantity = qty;

          // Check Health
          const stockStatus = calculateStockHealthStatus(
            qty,
            stock.min_stock_level,
            stock.reorder_point,
          );

          if (stockStatus === StockHealthStatus.CRITICAL) isCritical = true;
          if (stockStatus === StockHealthStatus.WARNING) isWarning = true;
        });

        // Calculate usable stock (total - expired)
        totalUsableQuantity = calculateUsableStock(
          totalQuantity,
          totalExpiredQty,
          totalExpiringSoonQty,
          excludeExpiringSoon,
        );

        // Determine stock health state based on expiry and availability
        worstStockHealthState = determineStockHealthState(
          totalUsableQuantity,
          totalQuantity,
          totalExpiredQty,
          totalExpiringSoonQty,
          undefined, // No single reorder point for company-level
        );
      }

      // Determine final status
      // CRITICAL → any warehouse below min_stock_level
      // WARNING → any warehouse below reorder_point
      let status = StockHealthStatus.OK;
      if (isCritical) {
        status = StockHealthStatus.CRITICAL;
      } else if (isWarning) {
        status = StockHealthStatus.WARNING;
      }

      return {
        productId: product.id,
        product,
        totalQuantity,
        usableQuantity: totalUsableQuantity, // NEW
        stockHealthState: worstStockHealthState, // NEW
        warehouseCount,
        minQuantity,
        maxQuantity,
        status,
      };
    });

    // 4. Apply status filter (in-memory)
    // Since status is computed, we can't easily filter in SQL without complex subqueries
    // If status filter is present, we might return fewer than 'limit' items.
    // For a perfect pagination with status filter, we'd need a more complex SQL approach.
    // For Phase 1, we accept that filtering by status might reduce page size.
    if (filters.status) {
      return result.filter((item) => item.status === filters.status);
    }

    return result;
  }

  // ===========================
  // VISUALIZATION AGGREGATIONS
  // ===========================

  /**
   * Get inventory health status distribution (OK, WARNING, CRITICAL counts)
   */
  async getInventoryHealthStats(
    companyId: string,
  ): Promise<InventoryHealthStats> {
    const products = await this.productRepository.find({
      where: { company_id: companyId, is_active: true },
    });

    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) {
      return { okCount: 0, warningCount: 0, criticalCount: 0 };
    }

    const stocks = await this.stockRepository.find({
      where: { product_id: In(productIds), company_id: companyId },
    });

    // Group stocks by product
    const productStatusMap = new Map<string, StockHealthStatus>();

    products.forEach((product) => {
      const productStocks = stocks.filter((s) => s.product_id === product.id);

      let isCritical = false;
      let isWarning = false;

      productStocks.forEach((stock) => {
        const status = calculateStockHealthStatus(
          stock.quantity,
          stock.min_stock_level,
          stock.reorder_point,
        );
        if (status === StockHealthStatus.CRITICAL) isCritical = true;
        if (status === StockHealthStatus.WARNING) isWarning = true;
      });

      const finalStatus = isCritical
        ? StockHealthStatus.CRITICAL
        : isWarning
          ? StockHealthStatus.WARNING
          : StockHealthStatus.OK;

      productStatusMap.set(product.id, finalStatus);
    });

    let okCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    productStatusMap.forEach((status) => {
      if (status === StockHealthStatus.OK) okCount++;
      else if (status === StockHealthStatus.WARNING) warningCount++;
      else if (status === StockHealthStatus.CRITICAL) criticalCount++;
    });

    return { okCount, warningCount, criticalCount };
  }

  /**
   * Get top N products by total stock
   */
  async getTopStockProducts(
    companyId: string,
    limit: number = 10,
  ): Promise<TopStockProduct[]> {
    const result = await this.stockRepository
      .createQueryBuilder('stock')
      .select('stock.product_id', 'productid')
      .addSelect('SUM(stock.quantity)', 'totalquantity')
      .leftJoin('stock.product', 'product')
      .addSelect('product.name', 'productname')
      .addSelect('product.sku', 'sku')
      .where('stock.company_id = :companyId', { companyId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .groupBy('stock.product_id')
      .addGroupBy('product.name')
      .addGroupBy('product.sku')
      .orderBy('SUM(stock.quantity)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      productId: item.productid,
      productName: item.productname,
      sku: item.sku,
      totalQuantity: parseInt(item.totalquantity),
    }));
  }

  /**
   * Get critical stock products with lowest warehouse stock
   */
  async getCriticalStockProducts(
    companyId: string,
    limit: number = 10,
  ): Promise<CriticalStockProduct[]> {
    const products = await this.productRepository.find({
      where: { company_id: companyId, is_active: true },
      take: 100, // Process first 100 products for performance
    });

    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) return [];

    const stocks = await this.stockRepository.find({
      where: { product_id: In(productIds), company_id: companyId },
      relations: ['product', 'warehouse'],
    });

    const criticalProducts: CriticalStockProduct[] = [];

    for (const product of products) {
      const productStocks = stocks.filter((s) => s.product_id === product.id);

      let isCritical = false;
      let lowestStock: Stock | null = null;

      for (const stock of productStocks) {
        const status = calculateStockHealthStatus(
          stock.quantity,
          stock.min_stock_level,
          stock.reorder_point,
        );
        if (status === StockHealthStatus.CRITICAL) {
          isCritical = true;
          if (!lowestStock || stock.quantity < lowestStock.quantity) {
            lowestStock = stock;
          }
        }
      }

      if (isCritical && lowestStock !== null) {
        criticalProducts.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          lowestWarehouseStock: lowestStock.quantity,
          warehouseName: lowestStock.warehouse?.name || 'Unknown',
        });
      }
    }

    return criticalProducts.slice(0, limit);
  }

  /**
   * Get stock distribution across warehouses for a specific product
   */
  async getWarehouseStockDistribution(
    productId: string,
    companyId: string,
  ): Promise<WarehouseStockDistribution[]> {
    const stocks = await this.stockRepository.find({
      where: { product_id: productId, company_id: companyId },
      relations: ['warehouse'],
    });

    return stocks.map((stock) => {
      const status = calculateStockHealthStatus(
        stock.quantity,
        stock.min_stock_level,
        stock.reorder_point,
      );

      return {
        warehouseId: stock.warehouse_id,
        warehouseName: stock.warehouse?.name || 'Unknown',
        quantity: stock.quantity,
        minLevel: stock.min_stock_level,
        reorderPoint: stock.reorder_point,
        status,
      };
    });
  }

  /**
   * Get warehouse health scorecard (OK/WARNING/CRITICAL counts per warehouse)
   */
  async getWarehouseHealthScorecard(
    companyId: string,
  ): Promise<WarehouseHealthScore[]> {
    const stocks = await this.stockRepository.find({
      where: { company_id: companyId },
      relations: ['warehouse'],
    });

    const warehouseMap = new Map<
      string,
      { name: string; ok: number; warning: number; critical: number }
    >();

    stocks.forEach((stock) => {
      if (!stock.warehouse) return;

      if (!warehouseMap.has(stock.warehouse_id)) {
        warehouseMap.set(stock.warehouse_id, {
          name: stock.warehouse.name,
          ok: 0,
          warning: 0,
          critical: 0,
        });
      }

      const status = calculateStockHealthStatus(
        stock.quantity,
        stock.min_stock_level,
        stock.reorder_point,
      );

      const warehouseData = warehouseMap.get(stock.warehouse_id)!;
      if (status === StockHealthStatus.OK) warehouseData.ok++;
      else if (status === StockHealthStatus.WARNING) warehouseData.warning++;
      else if (status === StockHealthStatus.CRITICAL) warehouseData.critical++;
    });

    return Array.from(warehouseMap.entries()).map(([warehouseId, data]) => ({
      warehouseId,
      warehouseName: data.name,
      okCount: data.ok,
      warningCount: data.warning,
      criticalCount: data.critical,
    }));
  }

  /**
   * Get stock movement trends over time
   */
  async getMovementTrends(
    companyId: string,
    days: number = 30,
  ): Promise<MovementTrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.stockMovementRepository.find({
      where: {
        company_id: companyId,
        created_at: Between(startDate, new Date()),
      },
      order: { created_at: 'ASC' },
    });

    const dateMap = new Map<
      string,
      { inQuantity: number; outQuantity: number }
    >();

    movements.forEach((movement) => {
      const dateStr = movement.created_at.toISOString().split('T')[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { inQuantity: 0, outQuantity: 0 });
      }

      const data = dateMap.get(dateStr)!;
      const qty = Math.abs(movement.quantity);

      // IN movements: IN, OPENING, ADJUSTMENT_IN, TRANSFER_IN
      if (
        movement.type === MovementType.IN ||
        movement.type === MovementType.OPENING ||
        movement.type === MovementType.ADJUSTMENT_IN ||
        movement.type === MovementType.TRANSFER_IN
      ) {
        data.inQuantity += qty;
      } else {
        data.outQuantity += qty;
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        inQuantity: data.inQuantity,
        outQuantity: data.outQuantity,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get movement type breakdown (count and total quantity per type)
   */
  async getMovementTypeBreakdown(
    companyId: string,
    days: number = 30,
  ): Promise<MovementTypeBreakdown[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .select('movement.type', 'type')
      .addSelect('COUNT(movement.id)', 'count')
      .addSelect('SUM(ABS(movement.quantity))', 'totalquantity')
      .where('movement.company_id = :companyId', { companyId })
      .andWhere('movement.created_at >= :startDate', { startDate })
      .groupBy('movement.type')
      .getRawMany();

    return result.map((item) => ({
      type: item.type,
      count: parseInt(item.count),
      totalQuantity: parseInt(item.totalquantity || '0'),
    }));
  }

  /**
   * Get adjustment trends over time
   */
  async getAdjustmentTrends(
    companyId: string,
    days: number = 30,
  ): Promise<AdjustmentTrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.stockMovementRepository.find({
      where: {
        company_id: companyId,
        type: In([MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT]),
        created_at: Between(startDate, new Date()),
      },
      order: { created_at: 'ASC' },
    });

    const dateMap = new Map<
      string,
      { inQuantity: number; outQuantity: number }
    >();

    movements.forEach((movement) => {
      const dateStr = movement.created_at.toISOString().split('T')[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { inQuantity: 0, outQuantity: 0 });
      }

      const data = dateMap.get(dateStr)!;
      const qty = Math.abs(movement.quantity);

      if (movement.type === MovementType.ADJUSTMENT_IN) {
        data.inQuantity += qty;
      } else {
        data.outQuantity += qty;
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        adjustmentInQuantity: data.inQuantity,
        adjustmentOutQuantity: data.outQuantity,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get adjustments by warehouse
   */
  async getAdjustmentsByWarehouse(
    companyId: string,
    days: number = 30,
  ): Promise<AdjustmentByWarehouse[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .select('movement.warehouse_id', 'warehouseid')
      .addSelect('COUNT(movement.id)', 'totaladjustments')
      .leftJoin('movement.warehouse', 'warehouse')
      .addSelect('warehouse.name', 'warehousename')
      .where('movement.company_id = :companyId', { companyId })
      .andWhere('movement.type IN (:...types)', {
        types: [MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT],
      })
      .andWhere('movement.created_at >= :startDate', { startDate })
      .groupBy('movement.warehouse_id')
      .addGroupBy('warehouse.name')
      .orderBy('COUNT(movement.id)', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      warehouseId: item.warehouseid,
      warehouseName: item.warehousename || 'Unknown',
      totalAdjustments: parseInt(item.totaladjustments),
    }));
  }

  /**
   * Get adjustments by user
   */
  async getAdjustmentsByUser(
    companyId: string,
    days: number = 30,
    limit: number = 10,
  ): Promise<AdjustmentByUser[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .select('movement.performed_by', 'userid')
      .addSelect('COUNT(movement.id)', 'adjustmentcount')
      .addSelect('SUM(ABS(movement.quantity))', 'totalquantity')
      .leftJoin('movement.user', 'user')
      .addSelect('user.fullName', 'username')
      .where('movement.company_id = :companyId', { companyId })
      .andWhere('movement.performed_by IS NOT NULL')
      .andWhere('movement.type IN (:...types)', {
        types: [MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT],
      })
      .andWhere('movement.created_at >= :startDate', { startDate })
      .groupBy('movement.performed_by')
      .addGroupBy('user.fullName')
      .orderBy('COUNT(movement.id)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      userId: item.userid,
      userName: item.username || 'Unknown User',
      adjustmentCount: parseInt(item.adjustmentcount),
      totalQuantity: parseInt(item.totalquantity || '0'),
    }));
  }

  // ===========================
  // STOCK LOT MANAGEMENT (EXPIRY HANDLING)
  // ===========================

  /**
   * Create a new stock lot
   */
  async createStockLot(input: CreateStockLotInput): Promise<StockLot> {
    // Validate expiry date is not in the past
    if (input.expiry_date && isExpiryInPastEndOfDay(input.expiry_date)) {
      throw new BadRequestException('Expiry date cannot be in the past');
    }

    const lot = this.stockLotRepository.create({
      ...input,
      expiry_date: input.expiry_date
        ? normalizeExpiryToEndOfDayUTC(input.expiry_date)
        : input.expiry_date,
    });
    return this.stockLotRepository.save(lot);
  }

  /**
   * Get stock lots with optional filtering
   */
  async getStockLots(
    filters: StockLotFilterInput,
    companyId: string,
  ): Promise<StockLot[]> {
    const query = this.stockLotRepository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.product', 'product')
      .leftJoinAndSelect('lot.warehouse', 'warehouse')
      .where('lot.company_id = :companyId', { companyId })
      .andWhere('lot.quantity > 0'); // Only non-depleted lots

    if (filters.warehouse_id) {
      query.andWhere('lot.warehouse_id = :warehouseId', {
        warehouseId: filters.warehouse_id,
      });
    }

    if (filters.product_id) {
      query.andWhere('lot.product_id = :productId', {
        productId: filters.product_id,
      });
    }

    if (filters.limit) {
      query.limit(filters.limit);
    }

    const lots = await query.getMany();

    // Filter by expiry status if requested
    if (filters.expiry_status) {
      const statusFiltered = lots.filter((lot) => {
        const status = this.calculateExpiryStatus(lot.expiry_date, companyId);
        return status === filters.expiry_status;
      });
      return statusFiltered;
    }

    return lots;
  }

  /**
   * Get lots that are expiring soon or expired
   */
  async getExpiringLots(
    companyId: string,
    warningDays: number = 30,
  ): Promise<StockLotWithStatus[]> {
    const cutoffDate = endOfDayUtcFromNowPlusDays(warningDays);

    const lots = await this.stockLotRepository.find({
      where: {
        company_id: companyId,
        expiry_date: LessThan(cutoffDate),
      },
      relations: ['product', 'warehouse'],
      order: {
        expiry_date: 'ASC',
      },
    });

    return lots
      .filter((lot) => lot.quantity > 0)
      .map((lot) => ({
        lot,
        status: this.calculateExpiryStatus(
          lot.expiry_date,
          companyId,
          warningDays,
        ),
        days_to_expiry: lot.expiry_date
          ? Math.ceil(
            (lot.expiry_date.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
          )
          : undefined,
      }));
  }

  /**
   * Calculate expiry status for a lot
   */
  calculateExpiryStatus(
    expiryDate: Date | null,
    companyId: string,
    warningDays: number = 30,
  ): ExpiryStatus {
    if (!expiryDate) {
      return ExpiryStatus.OK; // Non-perishable
    }

    const now = new Date();
    const expiry = normalizeExpiryToEndOfDayUTC(expiryDate);

    if (expiry < now) {
      return ExpiryStatus.EXPIRED;
    }

    const daysToExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysToExpiry <= warningDays) {
      return ExpiryStatus.EXPIRING_SOON;
    }

    return ExpiryStatus.OK;
  }

  /**
   * Update lot quantity (atomic operation)
   */
  async updateLotQuantity(
    input: UpdateStockLotQuantityInput,
  ): Promise<StockLot> {
    const lot = await this.stockLotRepository.findOne({
      where: { id: input.lot_id },
    });

    if (!lot) {
      throw new NotFoundException('Stock lot not found');
    }

    const newQuantity = lot.quantity + input.quantity_delta;

    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient quantity in lot');
    }

    lot.quantity = newQuantity;
    return this.stockLotRepository.save(lot);
  }

  /**
   * Get earliest received lot for a product in a warehouse (for transfers)
   */
  async getEarliestReceivedLot(
    productId: string,
    warehouseId: string,
  ): Promise<StockLot | null> {
    return this.stockLotRepository.findOne({
      where: {
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: MoreThan(0),
      },
      order: {
        received_at: 'ASC',
      },
    });
  }

  /**
   * Aggregate stock from lots (recompute stock table)
   */
  async aggregateStockFromLots(
    productId: string,
    warehouseId: string,
  ): Promise<void> {
    const lots = await this.stockLotRepository.find({
      where: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    });

    const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);

    // Update stock table
    const stock = await this.stockRepository.findOne({
      where: {
        product_id: productId,
        warehouse_id: warehouseId,
      },
    });

    if (stock) {
      stock.quantity = totalQuantity;
      await this.stockRepository.save(stock);
    }
  }

  /**
   * Get company-wide stock health overview
   * Aggregates warehouse risk metrics and blocked products count
   */
  async getCompanyStockHealthOverview(
    companyId: string,
  ): Promise<CompanyStockHealthOverview> {
    // Get all warehouses for this company
    const warehouses = await this.dataSource.getRepository(Warehouse).find({
      where: { company_id: companyId },
    });

    const warehouseRiskMetrics: WarehouseRiskMetric[] = [];
    let totalBlockedProducts = 0;
    const processedProducts = new Set<string>(); // Track products already counted as blocked

    for (const warehouse of warehouses) {
      // Get stock health for this warehouse
      const warehouseHealth =
        await this.stockHealthService.getWarehouseStockHealth(warehouse.id);

      let blockedCount = 0;
      let totalStock = 0;
      let expiredQty = 0;
      let expiringSoonQty = 0;

      warehouseHealth.forEach((health) => {
        totalStock += health.totalStock;
        expiredQty += health.expiredQty;
        expiringSoonQty += health.expiringSoonQty;

        if (health.state === StockHealthState.BLOCKED) {
          blockedCount++;
          // Only count each product once for total blocked products
          if (!processedProducts.has(health.productId)) {
            totalBlockedProducts++;
            processedProducts.add(health.productId);
          }
        }
      });

      // Calculate percentages
      const expiredPercentage =
        totalStock > 0 ? (expiredQty / totalStock) * 100 : 0;
      const expiringSoonPercentage =
        totalStock > 0 ? (expiringSoonQty / totalStock) * 100 : 0;

      // Calculate health score (0-100, higher is better)
      // 100 - (expired% + expiring%/2) - capped at 0 minimum
      const healthScore = Math.max(
        0,
        100 - expiredPercentage - expiringSoonPercentage / 2,
      );

      warehouseRiskMetrics.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        warehouseSlug: warehouse.slug,
        blockedProductCount: blockedCount,
        expiredPercentage: parseFloat(expiredPercentage.toFixed(2)),
        expiringSoonPercentage: parseFloat(expiringSoonPercentage.toFixed(2)),
        healthScore: parseFloat(healthScore.toFixed(2)),
        lastUpdated: new Date().toISOString(),
      });
    }

    return {
      totalBlockedProducts,
      warehouseRiskMetrics,
      lastUpdated: new Date().toISOString(),
    };
  }
}
