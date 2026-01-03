import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { WarehouseSettings } from './warehouse-settings.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { Between } from 'typeorm';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UpdateWarehouseSettingsInput } from './dto/update-warehouse.input';
import slugify from 'slugify';

@Injectable()
export class WarehouseService {

  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseSettings)
    private warehouseSettingsRepository: Repository<WarehouseSettings>,
    @InjectRepository(UserWarehouse)
    private userWarehouseRepository: Repository<UserWarehouse>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
  ) { }

  async getKPIs(warehouseId: string): Promise<any> {
    const totalProducts = await this.stockRepository.count({
      where: { warehouse_id: warehouseId }
    });

    const { totalQuantity } = await this.stockRepository
      .createQueryBuilder('stock')
      .select('SUM(stock.quantity)', 'totalQuantity')
      .where('stock.warehouse_id = :warehouseId', { warehouseId })
      .getRawOne();

    // Using query builder for low stock to handle the comparison properly if needed, 
    // but assuming simple logic: quantity <= reorder_point OR quantity <= min_stock_level
    // The requirement says "Low Stock Items" -> Low Stock logic.
    // Usually Low Stock means quantity <= reorder_point AND quantity > 0
    // Out Of Stock means quantity = 0

    const lowStockCount = await this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('stock.quantity > 0')
      .andWhere('(stock.quantity <= stock.reorder_point OR stock.quantity <= stock.min_stock_level)')
      .getCount();

    const outOfStockCount = await this.stockRepository.count({
      where: {
        warehouse_id: warehouseId,
        quantity: 0
      }
    });

    // Adjustments Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const adjustmentsToday = await this.stockMovementRepository.count({
      where: [
        {
          warehouse_id: warehouseId,
          type: 'ADJUSTMENT_IN' as any,
          created_at: Between(todayStart, todayEnd)
        },
        {
          warehouse_id: warehouseId,
          type: 'ADJUSTMENT_OUT' as any,
          created_at: Between(todayStart, todayEnd)
        },
        // Legacy support if needed
        {
          warehouse_id: warehouseId,
          type: 'ADJUSTMENT' as any,
          created_at: Between(todayStart, todayEnd)
        }
      ]
    });

    // Transfers Today - Assuming TRANSFER_IN or TRANSFER_OUT
    const transfersToday = await this.stockMovementRepository.count({
      where: [
        {
          warehouse_id: warehouseId,
          type: 'TRANSFER_IN' as any,
          created_at: Between(todayStart, todayEnd)
        },
        {
          warehouse_id: warehouseId,
          type: 'TRANSFER_OUT' as any,
          created_at: Between(todayStart, todayEnd)
        }
      ]
    });

    return {
      totalProducts,
      totalQuantity: parseInt(totalQuantity) || 0,
      lowStockCount,
      outOfStockCount,
      adjustmentsToday,
      transfersToday,
    };
  }

  async getLowStockPreview(warehouseId: string, limit: number): Promise<any[]> {
    const lowStockItems = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('stock.quantity > 0') // Exclude out of stock for this list? Or include? "Low Stock Snapshot" usually implies items running low but not empty. Let's assume low stock logic.
      .andWhere('(stock.quantity <= stock.reorder_point OR stock.quantity <= stock.min_stock_level)')
      .take(limit)
      .getMany();

    return lowStockItems.map(item => ({
      product: {
        name: item.product.name,
        sku: item.product.sku
      },
      quantity: item.quantity,
      status: 'WARNING' // Dynamic status logic can be here. simple for now. 
      // If quantity <= min_stock_level -> CRITICAL? 
    })).map(item => {
      // Refine status logic if possible, reusing logic from Stock entity if it exists or doing it here
      // For now hardcode WARNING as it's "Low Stock" list. Or check against min/reorder.
      // We can do it better:
      return item;
    });
  }

  // Helper for status calculation
  private calculateStockStatus(stock: Stock): string {
    if (stock.quantity === 0) return 'CRITICAL'; // Out of stock
    if (stock.min_stock_level !== null && stock.quantity <= stock.min_stock_level) return 'CRITICAL';
    if (stock.reorder_point !== null && stock.quantity <= stock.reorder_point) return 'WARNING';
    return 'OK';
  }

  async getLowStockPreviewWithStatus(warehouseId: string, limit: number): Promise<any[]> {
    const lowStockItems = await this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .where('stock.warehouse_id = :warehouseId', { warehouseId })
      //.andWhere('stock.quantity > 0') // "Low Stock Page" usually has <= reorder point.
      .andWhere('(stock.quantity <= stock.reorder_point OR stock.quantity <= stock.min_stock_level OR stock.quantity = 0)')
      .orderBy('stock.quantity', 'ASC')
      .take(limit)
      .getMany();

    return lowStockItems.map(item => ({
      product: {
        name: item.product.name,
        sku: item.product.sku
      },
      quantity: item.quantity,
      status: this.calculateStockStatus(item)
    }));
  }


  async getRecentMovements(warehouseId: string, limit: number): Promise<any[]> {
    const movements = await this.stockMovementRepository.find({
      where: { warehouse_id: warehouseId },
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['product', 'user'],
    });

    return movements.map(m => ({
      type: m.type,
      quantity: m.quantity,
      product: {
        name: m.product.name,
      },
      createdAt: m.created_at,
      performedBy: m.user ? { name: m.user.fullName || 'User' } : { name: 'System' }
    }));
  }

  async create(createWarehouseDto: CreateWarehouseDto, companyId: string, userId: string): Promise<Warehouse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const slug = slugify(createWarehouseDto.name, { lower: true, strict: true });
      // TODO: Check unique slug per company? reusing name for now as requested.

      const warehouse = queryRunner.manager.create(Warehouse, {
        ...createWarehouseDto,
        slug,
        company_id: companyId,
      });
      const savedWarehouse = await queryRunner.manager.save(warehouse);

      const userWarehouse = queryRunner.manager.create(UserWarehouse, {
        user_id: userId,
        warehouse_id: savedWarehouse.id,
        role: 'OWNER',
      });
      await queryRunner.manager.save(userWarehouse);

      await queryRunner.commitTransaction();
      return savedWarehouse;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(companyId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['settings'],
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findOne(id);

    // If setting this warehouse as default, unset all other defaults in the same company
    if (updateWarehouseDto.is_default === true) {
      await this.warehouseRepository.update(
        { company_id: warehouse.company_id },
        { is_default: false }
      );
    }

    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: string): Promise<void> {
    const result = await this.warehouseRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
  }

  async findByUser(userId: string, companyId?: string): Promise<Warehouse[]> {
    const userWarehouses = await this.userWarehouseRepository.find({
      where: { user_id: userId },
      relations: ['warehouse'],
    });

    const warehouses = userWarehouses
      .map((uw) => uw.warehouse)
      .filter((w) => !!w);

    if (!companyId) return warehouses;

    return warehouses.filter((w) => w.company_id === companyId);
  }

  async assignUser(warehouseId: string, userId: string, role?: string): Promise<UserWarehouse> {
    // Check if assignments exists
    const existing = await this.userWarehouseRepository.findOne({
      where: { warehouse_id: warehouseId, user_id: userId },
    });
    if (existing) {
      if (role && existing.role !== role) {
        existing.role = role;
        return this.userWarehouseRepository.save(existing);
      }
      return existing;
    }

    const assignment = this.userWarehouseRepository.create({
      warehouse_id: warehouseId,
      user_id: userId,
      role: role || 'STAFF',
    });
    return this.userWarehouseRepository.save(assignment);
  }

  async removeUser(warehouseId: string, userId: string): Promise<void> {
    await this.userWarehouseRepository.delete({
      warehouse_id: warehouseId,
      user_id: userId,
    });
  }

  async updateSettings(warehouseId: string, input: UpdateWarehouseSettingsInput): Promise<WarehouseSettings> {
    // Check if settings exist
    let settings = await this.warehouseSettingsRepository.findOne({
      where: { warehouse_id: warehouseId },
    });

    if (!settings) {
      // Create new settings if they don't exist
      settings = this.warehouseSettingsRepository.create({
        warehouse_id: warehouseId,
        ...input,
      });
    } else {
      // Update existing settings
      Object.assign(settings, input);
    }

    return this.warehouseSettingsRepository.save(settings);
  }

  // ============================================
  // Warehouse Reports
  // ============================================

  /**
   * Stock Snapshot - CURRENT STATE ONLY (no date filters)
   * Reuses existing low-stock logic from calculateStockStatus
   */
  async getStockSnapshot(warehouseId: string, filters: any): Promise<any> {
    const queryBuilder = this.stockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('stock.warehouse_id = :warehouseId', { warehouseId });

    // Apply filters
    if (filters.categoryId) {
      queryBuilder.andWhere('product.category_id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.status) {
      // Apply low-stock filtering based on status
      if (filters.status === 'CRITICAL') {
        queryBuilder.andWhere(
          '(stock.quantity = 0 OR (stock.min_stock_level IS NOT NULL AND stock.quantity <= stock.min_stock_level))'
        );
      } else if (filters.status === 'WARNING') {
        queryBuilder.andWhere(
          'stock.quantity > 0 AND stock.reorder_point IS NOT NULL AND stock.quantity <= stock.reorder_point AND (stock.min_stock_level IS NULL OR stock.quantity > stock.min_stock_level)'
        );
      } else if (filters.status === 'OK') {
        queryBuilder.andWhere(
          '(stock.reorder_point IS NULL OR stock.quantity > stock.reorder_point) AND (stock.min_stock_level IS NULL OR stock.quantity > stock.min_stock_level) AND stock.quantity > 0'
        );
      }
    }

    // Pagination
    const total = await queryBuilder.getCount();

    const items = await queryBuilder
      .orderBy('product.name', 'ASC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getMany();

    return {
      items: items.map(stock => ({
        id: stock.id,
        productName: stock.product.name,
        sku: stock.product.sku,
        categoryName: stock.product.category?.name || null,
        quantity: stock.quantity,
        unit: stock.product.unit || null,
        status: this.calculateStockStatus(stock),
        lastUpdated: stock.updated_at,
      })),
      total,
    };
  }

  /**
   * Stock Movements - HISTORICAL (requires date range)
   */
  async getStockMovements(warehouseId: string, filters: any): Promise<any> {
    const queryBuilder = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user')
      .where('movement.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('movement.created_at >= :fromDate', { fromDate: filters.fromDate })
      .andWhere('movement.created_at <= :toDate', { toDate: filters.toDate });

    // Apply movement type filter
    if (filters.types && filters.types.length > 0) {
      queryBuilder.andWhere('movement.type IN (:...types)', { types: filters.types });
    }

    // Apply product filter
    if (filters.productId) {
      queryBuilder.andWhere('movement.product_id = :productId', { productId: filters.productId });
    }

    // Pagination
    const total = await queryBuilder.getCount();

    const items = await queryBuilder
      .orderBy('movement.created_at', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getMany();

    return {
      items: items.map(movement => ({
        id: movement.id,
        createdAt: movement.created_at,
        productName: movement.product.name,
        sku: movement.product.sku,
        type: movement.type,
        quantity: movement.quantity,
        referenceId: movement.reference_id,
        referenceType: movement.reference_type,
        reason: movement.reason,
        performedBy: movement.user?.fullName || 'System',
        userRole: movement.user_role,
      })),
      total,
    };
  }

  /**
   * Adjustment Report - HISTORICAL (adjustments only, requires date range)
   */
  async getAdjustmentReport(warehouseId: string, filters: any): Promise<any> {
    const queryBuilder = this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user')
      .where('movement.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('movement.created_at >= :fromDate', { fromDate: filters.fromDate })
      .andWhere('movement.created_at <= :toDate', { toDate: filters.toDate });

    // Filter by adjustment types only
    if (filters.adjustmentType) {
      queryBuilder.andWhere('movement.type = :type', { type: filters.adjustmentType });
    } else {
      queryBuilder.andWhere('movement.type IN (:...types)', {
        types: ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'ADJUSTMENT'],
      });
    }

    // Apply product filter
    if (filters.productId) {
      queryBuilder.andWhere('movement.product_id = :productId', { productId: filters.productId });
    }

    // Apply user filter
    if (filters.userId) {
      queryBuilder.andWhere('movement.performed_by = :userId', { userId: filters.userId });
    }

    // Pagination
    const total = await queryBuilder.getCount();

    const items = await queryBuilder
      .orderBy('movement.created_at', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50)
      .getMany();

    return {
      items: items.map(movement => ({
        id: movement.id,
        createdAt: movement.created_at,
        productName: movement.product.name,
        sku: movement.product.sku,
        adjustmentType: movement.type,
        quantity: movement.quantity,
        reason: movement.reason || null,
        referenceId: movement.reference_id,
        performedBy: movement.user?.fullName || 'System',
        userRole: movement.user_role,
      })),
      total,
    };
  }
}