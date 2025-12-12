import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Unit } from './entities/unit.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { CreateCategoryInput, UpdateCategoryInput } from './dto/category.input';
import { CreateProductInput, UpdateProductInput } from './dto/product.input';
import { CreateStockInput, UpdateStockInput, AdjustStockInput, StockMovementFilterInput } from './dto/stock.input';

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
        return this.categoryRepository.save(category);
    }

    async removeCategory(id: string, companyId: string): Promise<boolean> {
        // Check if products exist? For now, let's allow delete (products will set category_id null via DB constraint)
        const result = await this.categoryRepository.delete({ id, company_id: companyId });
        if (result.affected === 0) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
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
        return this.productRepository.save(product);
    }

    async removeProduct(id: string, companyId: string): Promise<boolean> {
        const result = await this.productRepository.delete({ id, company_id: companyId });
        if (result.affected === 0) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
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

    async adjustStock(input: AdjustStockInput, companyId: string, userId: string): Promise<Stock> {
        // Find or create stock record
        let stock = await this.stockRepository.findOne({
            where: {
                product_id: input.product_id,
                warehouse_id: input.warehouse_id,
                company_id: companyId,
            },
        });

        if (!stock) {
            // Auto-create stock if it doesn't exist
            stock = await this.createStock(
                {
                    product_id: input.product_id,
                    warehouse_id: input.warehouse_id,
                    quantity: 0,
                },
                companyId,
                userId,
            );
        }

        const previousQuantity = stock.quantity;
        const newQuantity = previousQuantity + input.quantity;

        if (newQuantity < 0) {
            throw new BadRequestException('Insufficient stock. Cannot reduce below zero.');
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
            type: input.type,
            quantity: input.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: input.reason,
            reference_id: input.reference_id,
            reference_type: input.reference_type,
            performed_by: userId,
            notes: input.notes,
        });

        return updatedStock;
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

    async getLowStockItems(warehouseId: string | null, companyId: string): Promise<Stock[]> {
        const queryBuilder = this.stockRepository
            .createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('stock.warehouse', 'warehouse')
            .where('stock.company_id = :companyId', { companyId })
            .andWhere('stock.reorder_point IS NOT NULL')
            .andWhere('stock.quantity <= stock.reorder_point');

        if (warehouseId) {
            queryBuilder.andWhere('stock.warehouse_id = :warehouseId', { warehouseId });
        }

        return queryBuilder.getMany();
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
}
