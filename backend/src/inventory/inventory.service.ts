import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, LessThan, DataSource, In, MoreThan } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockLot, LotSourceType } from './entities/stock-lot.entity';
import { StockMovement, MovementType, ReferenceType } from './entities/stock-movement.entity';
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
import { CreateStockLotInput, UpdateStockLotQuantityInput, StockLotFilterInput } from './dto/stock-lot.input';
import { UpdateStockThresholdsInput } from './dto/stock-health.input';
import { CreateInventoryAdjustmentInput, AdjustmentType } from './dto/adjustment.input';
import { Warehouse } from '../warehouse/warehouse.entity';
import { StockHealthItem, StockHealthStatus, calculateStockHealthStatus } from './types/stock-health.types';
import { ExpiryStatus, StockLotWithStatus } from './types/expiry-status.types';
import { endOfDayUtcFromNowPlusDays, isExpiryInPastEndOfDay, normalizeExpiryToEndOfDayUTC } from '../common/utils/expiry-date';
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
} from './types/company-inventory.types';
import { CompanyInventorySummaryFilterInput } from './dto/stock.input';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Unit)
        private unitRepository: Repository<Unit>,
        @InjectRepository(Stock)
        private stockRepository: Repository<Stock>,
        @InjectRepository(StockLot)
        private stockLotRepository: Repository<StockLot>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        @InjectDataSource()
        private dataSource: DataSource,
    ) { }

    // --- Categories ---

    async createCategory(input: CreateCategoryInput, companyId: string): Promise<Category> {
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

    async updateCategory(input: UpdateCategoryInput, companyId: string): Promise<Category> {
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

    async createProduct(input: CreateProductInput, companyId: string): Promise<Product> {
        const product = this.productRepository.create({
            ...input,
            company_id: companyId,
        });
        return this.productRepository.save(product);
    }

    async findAllProducts(companyId: string): Promise<Product[]> {
        // Eager load category and supplier
        return this.productRepository.find({
            where: { company_id: companyId },
            order: { created_at: 'DESC' },
            relations: ['category', 'supplier'],
        });
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

    async updateProduct(input: UpdateProductInput, companyId: string): Promise<Product> {
        const product = await this.findOneProduct(input.id, companyId);
        Object.assign(product, input);
        // Restoring product when updating
        product.is_active = true;
        return this.productRepository.save(product);
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
            await this.unitRepository.update({ company_id: companyId }, { isDefault: false });
        }
        const unit: Unit = this.unitRepository.create({ ...input, company_id: companyId } as unknown as Unit);
        return this.unitRepository.save(unit);
    }

    async findAllUnits(companyId: string): Promise<Unit[]> {
        return this.unitRepository.find({ where: { company_id: companyId }, order: { name: 'ASC' } });
    }

    async updateUnit(input: any, companyId: string): Promise<Unit> {
        const unit = await this.unitRepository.findOne({ where: { id: input.id, company_id: companyId } });
        if (!unit) throw new NotFoundException(`Unit not found`);

        if (input.isDefault) {
            await this.unitRepository.update({ company_id: companyId }, { isDefault: false });
        }

        Object.assign(unit, input);
        return this.unitRepository.save(unit);
    }

    async removeUnit(id: string, companyId: string): Promise<boolean> {
        const result = await this.unitRepository.delete({ id, company_id: companyId });
        if (result.affected === 0) throw new NotFoundException(`Unit not found`);
        return true;
    }

    // --- Stock Management ---

    /**
     * Phase 1: Create opening stock for a product in a warehouse
     * This is the entry point for initial stock setup
     */
    async createOpeningStock(input: CreateOpeningStockInput, companyId: string, userId: string, userRole?: string): Promise<Stock> {
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
                    'Opening stock already exists for this product in this warehouse. Use adjust stock instead.'
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
            const lot = queryRunner.manager.create(StockLot, {
                company_id: companyId,
                warehouse_id: input.warehouse_id,
                product_id: input.product_id,
                quantity: input.quantity,
                expiry_date: input.expiry_date ? normalizeExpiryToEndOfDayUTC(input.expiry_date) : null,
                received_at: new Date(),
                source_type: LotSourceType.OPENING,
                source_id: null,
            } as any);

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

            return stockWithRelations;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createStock(input: CreateStockInput, companyId: string, userId: string): Promise<Stock> {
        // Check if stock already exists for this product in this warehouse
        const existing = await this.stockRepository.findOne({
            where: {
                product_id: input.product_id,
                warehouse_id: input.warehouse_id,
            },
        });

        if (existing) {
            throw new BadRequestException('Stock already exists for this product in this warehouse');
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

    async getStock(productId: string, warehouseId: string, companyId: string): Promise<Stock> {
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

    async getStockByWarehouse(warehouseId: string, companyId: string): Promise<Stock[]> {
        return this.stockRepository.find({
            where: {
                warehouse_id: warehouseId,
                company_id: companyId,
            },
            relations: ['product', 'product.category', 'product.supplier', 'warehouse'],
            order: { updated_at: 'DESC' },
        });
    }

    async getLotsForStock(stock: Pick<Stock, 'company_id' | 'product_id' | 'warehouse_id'>): Promise<StockLot[]> {
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

    async getStockByProduct(productId: string, companyId: string): Promise<Stock[]> {
        return this.stockRepository.find({
            where: {
                product_id: productId,
                company_id: companyId,
            },
            relations: ['product', 'warehouse'],
        });
    }

    async getAllStock(companyId: string): Promise<Stock[]> {
        return this.stockRepository.find({
            where: { company_id: companyId },
            relations: ['product', 'warehouse'],
        });
    }

    async updateStockLevels(input: UpdateStockInput, companyId: string): Promise<Stock> {
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

    async adjustStock(input: AdjustStockInput, companyId: string, userId: string, userRole?: string): Promise<Stock> {
        // Find or create stock record
        let stock = await this.stockRepository.findOne({
            where: {
                product_id: input.product_id,
                warehouse_id: input.warehouse_id,
                company_id: companyId,
            },
        });

        if (!stock) {
            // For Phase 1, require opening stock to exist first
            throw new BadRequestException(
                'Stock record not found. Please create opening stock first.'
            );
        }

        const previousQuantity = Number(stock.quantity);
        const newQuantity = previousQuantity + Number(input.quantity);

        if (newQuantity < 0) {
            throw new BadRequestException('Insufficient stock. Cannot reduce below zero.');
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

        // Create movement record
        await this.stockMovementRepository.save({
            stock_id: stock.id,
            product_id: input.product_id,
            warehouse_id: input.warehouse_id,
            company_id: companyId,
            type: movementType,
            quantity: input.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: input.reason || (input.quantity > 0 ? 'Stock adjustment (increase)' : 'Stock adjustment (decrease)'),
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
                throw new BadRequestException('Warehouse not found or does not belong to your company');
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
                    throw new BadRequestException('Stock record not found. Cannot reduce stock that doesn\'t exist.');
                }
                if (previousQty < adjustmentQty) {
                    throw new BadRequestException(
                        `Insufficient stock.Available: ${previousQty}, Requested: ${adjustmentQty} `
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
            const newQty = input.adjustment_type === AdjustmentType.IN
                ? previousQty + adjustmentQty
                : previousQty - adjustmentQty;

            // Step 6: Create stock movement (immutable audit record)
            const movementType = input.adjustment_type === AdjustmentType.IN
                ? MovementType.ADJUSTMENT_IN
                : MovementType.ADJUSTMENT_OUT;

            const movement = queryRunner.manager.create(StockMovement, {
                stock_id: stock!.id,  // We know stock exists at this point
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

            // Step 7: Update stock with ATOMIC operation (no .save())
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
                throw new BadRequestException('Failed to reload stock after adjustment');
            }

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

    async getStockMovements(filters: StockMovementFilterInput, companyId: string): Promise<StockMovement[]> {
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
            where.type = filters.type ? filters.type : filters.types.length === 1 ? filters.types[0] : In(filters.types);
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
            .andWhere('(stock.reorder_point IS NOT NULL OR stock.min_stock_level IS NOT NULL)') // FIX: Wrapped in parentheses
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

    async getStockValue(warehouseId: string | null, companyId: string): Promise<number> {
        const queryBuilder = this.stockRepository
            .createQueryBuilder('stock')
            .leftJoin('stock.product', 'product')
            .select('SUM(stock.quantity * product.cost_price)', 'total_value')
            .where('stock.company_id = :companyId', { companyId });

        if (warehouseId) {
            queryBuilder.andWhere('stock.warehouse_id = :warehouseId', { warehouseId });
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
        const newMin = input.min_stock_level !== undefined
            ? input.min_stock_level
            : stock.min_stock_level;
        const newReorder = input.reorder_point !== undefined
            ? input.reorder_point
            : stock.reorder_point;
        const newMax = input.max_stock_level !== undefined
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
            productQuery.andWhere('product.category_id = :categoryId', { categoryId: filters.categoryId });
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
        const productIds = products.map(p => p.id);
        const stockQuery = this.stockRepository
            .createQueryBuilder('stock')
            .where('stock.product_id IN (:...productIds)', { productIds })
            .andWhere('stock.company_id = :companyId', { companyId }); // Ensure company scope

        if (filters.warehouseId) {
            stockQuery.andWhere('stock.warehouse_id = :warehouseId', { warehouseId: filters.warehouseId });
        }

        const stocks = await stockQuery.getMany();

        // 3. Aggregate results
        const result: CompanyInventorySummaryItem[] = products.map(product => {
            // Get all stocks for this product
            const productStocks = stocks.filter(s => s.product_id === product.id);

            let totalQuantity = 0;
            let warehouseCount = 0;
            let minQuantity = 0; // Across warehouses (for display/stats)
            let maxQuantity = 0;

            // Health Logic
            let isCritical = false;
            let isWarning = false;

            if (productStocks.length > 0) {
                // Initialize min/max with first item
                minQuantity = productStocks[0].quantity;
                maxQuantity = productStocks[0].quantity;

                warehouseCount = productStocks.length;

                productStocks.forEach(stock => {
                    const qty = Number(stock.quantity);
                    totalQuantity += qty;

                    if (qty < minQuantity) minQuantity = qty;
                    if (qty > maxQuantity) maxQuantity = qty;

                    // Check Health
                    const stockStatus = calculateStockHealthStatus(
                        qty,
                        stock.min_stock_level,
                        stock.reorder_point
                    );

                    if (stockStatus === StockHealthStatus.CRITICAL) isCritical = true;
                    if (stockStatus === StockHealthStatus.WARNING) isWarning = true;
                });
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
            return result.filter(item => item.status === filters.status);
        }

        return result;
    }

    // ===========================
    // VISUALIZATION AGGREGATIONS
    // ===========================

    /**
     * Get inventory health status distribution (OK, WARNING, CRITICAL counts)
     */
    async getInventoryHealthStats(companyId: string): Promise<InventoryHealthStats> {
        const products = await this.productRepository.find({
            where: { company_id: companyId, is_active: true },
        });

        const productIds = products.map(p => p.id);
        if (productIds.length === 0) {
            return { okCount: 0, warningCount: 0, criticalCount: 0 };
        }

        const stocks = await this.stockRepository.find({
            where: { product_id: In(productIds), company_id: companyId },
        });

        // Group stocks by product
        const productStatusMap = new Map<string, StockHealthStatus>();

        products.forEach(product => {
            const productStocks = stocks.filter(s => s.product_id === product.id);

            let isCritical = false;
            let isWarning = false;

            productStocks.forEach(stock => {
                const status = calculateStockHealthStatus(
                    stock.quantity,
                    stock.min_stock_level,
                    stock.reorder_point
                );
                if (status === StockHealthStatus.CRITICAL) isCritical = true;
                if (status === StockHealthStatus.WARNING) isWarning = true;
            });

            const finalStatus = isCritical ? StockHealthStatus.CRITICAL :
                isWarning ? StockHealthStatus.WARNING :
                    StockHealthStatus.OK;

            productStatusMap.set(product.id, finalStatus);
        });

        let okCount = 0;
        let warningCount = 0;
        let criticalCount = 0;

        productStatusMap.forEach(status => {
            if (status === StockHealthStatus.OK) okCount++;
            else if (status === StockHealthStatus.WARNING) warningCount++;
            else if (status === StockHealthStatus.CRITICAL) criticalCount++;
        });

        return { okCount, warningCount, criticalCount };
    }

    /**
     * Get top N products by total stock
     */
    async getTopStockProducts(companyId: string, limit: number = 10): Promise<TopStockProduct[]> {
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

        return result.map(item => ({
            productId: item.productid,
            productName: item.productname,
            sku: item.sku,
            totalQuantity: parseInt(item.totalquantity),
        }));
    }

    /**
     * Get critical stock products with lowest warehouse stock
     */
    async getCriticalStockProducts(companyId: string, limit: number = 10): Promise<CriticalStockProduct[]> {
        const products = await this.productRepository.find({
            where: { company_id: companyId, is_active: true },
            take: 100, // Process first 100 products for performance
        });

        const productIds = products.map(p => p.id);
        if (productIds.length === 0) return [];

        const stocks = await this.stockRepository.find({
            where: { product_id: In(productIds), company_id: companyId },
            relations: ['product', 'warehouse'],
        });

        const criticalProducts: CriticalStockProduct[] = [];

        for (const product of products) {
            const productStocks = stocks.filter(s => s.product_id === product.id);

            let isCritical = false;
            let lowestStock: Stock | null = null;

            for (const stock of productStocks) {
                const status = calculateStockHealthStatus(
                    stock.quantity,
                    stock.min_stock_level,
                    stock.reorder_point
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
    async getWarehouseStockDistribution(productId: string, companyId: string): Promise<WarehouseStockDistribution[]> {
        const stocks = await this.stockRepository.find({
            where: { product_id: productId, company_id: companyId },
            relations: ['warehouse'],
        });

        return stocks.map(stock => {
            const status = calculateStockHealthStatus(
                stock.quantity,
                stock.min_stock_level,
                stock.reorder_point
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
    async getWarehouseHealthScorecard(companyId: string): Promise<WarehouseHealthScore[]> {
        const stocks = await this.stockRepository.find({
            where: { company_id: companyId },
            relations: ['warehouse'],
        });

        const warehouseMap = new Map<string, { name: string; ok: number; warning: number; critical: number }>();

        stocks.forEach(stock => {
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
                stock.reorder_point
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
    async getMovementTrends(companyId: string, days: number = 30): Promise<MovementTrendData[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const movements = await this.stockMovementRepository.find({
            where: {
                company_id: companyId,
                created_at: Between(startDate, new Date()),
            },
            order: { created_at: 'ASC' },
        });

        const dateMap = new Map<string, { inQuantity: number; outQuantity: number }>();

        movements.forEach(movement => {
            const dateStr = movement.created_at.toISOString().split('T')[0];

            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, { inQuantity: 0, outQuantity: 0 });
            }

            const data = dateMap.get(dateStr)!;
            const qty = Math.abs(movement.quantity);

            // IN movements: IN, OPENING, ADJUSTMENT_IN, TRANSFER_IN
            if (movement.type === MovementType.IN ||
                movement.type === MovementType.OPENING ||
                movement.type === MovementType.ADJUSTMENT_IN ||
                movement.type === MovementType.TRANSFER_IN) {
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
    async getMovementTypeBreakdown(companyId: string, days: number = 30): Promise<MovementTypeBreakdown[]> {
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

        return result.map(item => ({
            type: item.type,
            count: parseInt(item.count),
            totalQuantity: parseInt(item.totalquantity || '0'),
        }));
    }

    /**
     * Get adjustment trends over time
     */
    async getAdjustmentTrends(companyId: string, days: number = 30): Promise<AdjustmentTrendData[]> {
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

        const dateMap = new Map<string, { inQuantity: number; outQuantity: number }>();

        movements.forEach(movement => {
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
    async getAdjustmentsByWarehouse(companyId: string, days: number = 30): Promise<AdjustmentByWarehouse[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await this.stockMovementRepository
            .createQueryBuilder('movement')
            .select('movement.warehouse_id', 'warehouseid')
            .addSelect('COUNT(movement.id)', 'totaladjustments')
            .leftJoin('movement.warehouse', 'warehouse')
            .addSelect('warehouse.name', 'warehousename')
            .where('movement.company_id = :companyId', { companyId })
            .andWhere('movement.type IN (:...types)', { types: [MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT] })
            .andWhere('movement.created_at >= :startDate', { startDate })
            .groupBy('movement.warehouse_id')
            .addGroupBy('warehouse.name')
            .orderBy('COUNT(movement.id)', 'DESC')
            .getRawMany();

        return result.map(item => ({
            warehouseId: item.warehouseid,
            warehouseName: item.warehousename || 'Unknown',
            totalAdjustments: parseInt(item.totaladjustments),
        }));
    }

    /**
     * Get adjustments by user
     */
    async getAdjustmentsByUser(companyId: string, days: number = 30, limit: number = 10): Promise<AdjustmentByUser[]> {
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
            .andWhere('movement.type IN (:...types)', { types: [MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT] })
            .andWhere('movement.created_at >= :startDate', { startDate })
            .groupBy('movement.performed_by')
            .addGroupBy('user.fullName')
            .orderBy('COUNT(movement.id)', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map(item => ({
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
            expiry_date: input.expiry_date ? normalizeExpiryToEndOfDayUTC(input.expiry_date) : input.expiry_date,
        });
        return this.stockLotRepository.save(lot);
    }

    /**
     * Get stock lots with optional filtering
     */
    async getStockLots(filters: StockLotFilterInput, companyId: string): Promise<StockLot[]> {
        const query = this.stockLotRepository
            .createQueryBuilder('lot')
            .leftJoinAndSelect('lot.product', 'product')
            .leftJoinAndSelect('lot.warehouse', 'warehouse')
            .where('lot.company_id = :companyId', { companyId })
            .andWhere('lot.quantity > 0'); // Only non-depleted lots

        if (filters.warehouse_id) {
            query.andWhere('lot.warehouse_id = :warehouseId', { warehouseId: filters.warehouse_id });
        }

        if (filters.product_id) {
            query.andWhere('lot.product_id = :productId', { productId: filters.product_id });
        }

        if (filters.limit) {
            query.limit(filters.limit);
        }

        const lots = await query.getMany();

        // Filter by expiry status if requested
        if (filters.expiry_status) {
            const statusFiltered = lots.filter(lot => {
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
    async getExpiringLots(companyId: string, warningDays: number = 30): Promise<StockLotWithStatus[]> {
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
            .filter(lot => lot.quantity > 0)
            .map(lot => ({
                lot,
                status: this.calculateExpiryStatus(lot.expiry_date, companyId, warningDays),
                days_to_expiry: lot.expiry_date
                    ? Math.ceil((lot.expiry_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : undefined,
            }));
    }

    /**
     * Calculate expiry status for a lot
     */
    calculateExpiryStatus(expiryDate: Date | null, companyId: string, warningDays: number = 30): ExpiryStatus {
        if (!expiryDate) {
            return ExpiryStatus.OK; // Non-perishable
        }

        const now = new Date();
        const expiry = normalizeExpiryToEndOfDayUTC(expiryDate);

        if (expiry < now) {
            return ExpiryStatus.EXPIRED;
        }

        const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysToExpiry <= warningDays) {
            return ExpiryStatus.EXPIRING_SOON;
        }

        return ExpiryStatus.OK;
    }

    /**
     * Update lot quantity (atomic operation)
     */
    async updateLotQuantity(input: UpdateStockLotQuantityInput): Promise<StockLot> {
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
    async getEarliestReceivedLot(productId: string, warehouseId: string): Promise<StockLot | null> {
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
    async aggregateStockFromLots(productId: string, warehouseId: string): Promise<void> {
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
}
