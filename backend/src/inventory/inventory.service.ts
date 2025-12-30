import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { CreateCategoryInput, UpdateCategoryInput } from './dto/category.input';
import { CreateProductInput, UpdateProductInput } from './dto/product.input';
import { CreateStockInput, UpdateStockInput, AdjustStockInput, StockMovementFilterInput, CreateOpeningStockInput } from './dto/stock.input';
import { UpdateStockThresholdsInput } from './dto/stock-health.input';
import { StockHealthItem, StockHealthStatus, calculateStockHealthStatus } from './types/stock-health.types';

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
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
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
        // Check if stock already exists for this product in this warehouse
        const existing = await this.stockRepository.findOne({
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
        const product = await this.productRepository.findOne({
            where: { id: input.product_id, company_id: companyId, is_active: true },
        });

        if (!product) {
            throw new NotFoundException('Product not found or inactive');
        }

        // Create stock record
        const stock = this.stockRepository.create({
            product_id: input.product_id,
            warehouse_id: input.warehouse_id,
            company_id: companyId,
            quantity: input.quantity,
            min_stock_level: input.min_stock_level,
            max_stock_level: input.max_stock_level,
            reorder_point: input.reorder_point,
        });

        const savedStock = await this.stockRepository.save(stock);

        // Create opening stock movement
        await this.stockMovementRepository.save({
            stock_id: savedStock.id,
            product_id: input.product_id,
            warehouse_id: input.warehouse_id,
            company_id: companyId,
            type: MovementType.OPENING,
            quantity: input.quantity,
            previous_quantity: 0,
            new_quantity: input.quantity,
            reason: 'Opening stock',
            notes: input.note || 'Initial stock entry',
            performed_by: userId,
            user_role: userRole,
        });

        // Return stock with relations loaded
        const stockWithRelations = await this.stockRepository.findOne({
            where: { id: savedStock.id },
            relations: ['product', 'warehouse'],
        });

        if (!stockWithRelations) {
            throw new BadRequestException('Failed to load stock after creation');
        }

        return stockWithRelations;
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
            relations: ['product', 'product.category', 'warehouse'],
            order: { updated_at: 'DESC' },
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
            .andWhere('stock.reorder_point IS NOT NULL OR stock.min_stock_level IS NOT NULL')
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
}
