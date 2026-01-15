import { Repository } from 'typeorm';
import { Company } from '../../src/company/company.entity';
import { Warehouse } from '../../src/warehouse/warehouse.entity';
import { Product } from '../../src/inventory/entities/product.entity';
import { Category } from '../../src/inventory/entities/category.entity';
import { StockLot } from '../../src/inventory/entities/stock-lot.entity';
import { Stock } from '../../src/inventory/entities/stock.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Minimal test factory for invariant tests
 * Only creates basic entities needed to test core invariants
 */
export class MinimalTestFactory {
    constructor(
        private companyRepo: Repository<Company>,
        private warehouseRepo: Repository<Warehouse>,
        private productRepo: Repository<Product>,
        private categoryRepo: Repository<Category>,
        private stockRepo: Repository<Stock>,
        private lotRepo: Repository<StockLot>,
    ) { }

    /**
     * Create a test company
     */
    async createCompany(overrides: Partial<Company> = {}): Promise<Company> {
        const company = this.companyRepo.create({
            name: overrides.name || 'Test Company',
            slug: overrides.slug || `test-company-${Date.now()}`,
            owner_id: overrides.owner_id || uuidv4(),
            ...overrides,
        });
        return this.companyRepo.save(company);
    }

    /**
     * Create a test warehouse
     */
    async createWarehouse(
        companyId: string,
        overrides: Partial<Warehouse> = {},
    ): Promise<Warehouse> {
        const warehouse = this.warehouseRepo.create({
            name: overrides.name || 'Test Warehouse',
            slug: overrides.slug || `test-warehouse-${Date.now()}`,
            company_id: companyId,
            location: overrides.location || 'Test Location',
            ...overrides,
        });
        return this.warehouseRepo.save(warehouse);
    }

    /**
     * Create a test category
     */
    async createCategory(
        companyId: string,
        overrides: Partial<Category> = {},
    ): Promise<Category> {
        const category = this.categoryRepo.create({
            name: overrides.name || 'Test Category',
            company_id: companyId,
            ...overrides,
        });
        return this.categoryRepo.save(category);
    }

    /**
     * Create a test product
     */
    async createProduct(
        companyId: string,
        categoryId: string,
        overrides: Partial<Product> = {},
    ): Promise<Product> {
        const product = this.productRepo.create({
            name: overrides.name || `Test Product ${Date.now()}`,
            sku: overrides.sku || `SKU-${Date.now()}`,
            company_id: companyId,
            category_id: categoryId,
            unit: overrides.unit || 'Units',
            ...overrides,
        });
        return this.productRepo.save(product);
    }

    /**
     * Create stock lot (preferred method)
     * This automatically creates/updates stock aggregate
     */
    async createStockLot(params: {
        warehouseId: string;
        productId: string;
        quantity: number;
        expiryDate?: Date;
        sourceType?: string;
    }): Promise<StockLot> {
        // Find or create stock aggregate
        let stock = await this.stockRepo.findOne({
            where: {
                warehouse_id: params.warehouseId,
                product_id: params.productId,
            },
        });

        if (!stock) {
            stock = this.stockRepo.create({
                warehouse_id: params.warehouseId,
                product_id: params.productId,
                quantity: 0,
            });
            stock = await this.stockRepo.save(stock);
        }

        // Create lot
        const lot = this.lotRepo.create({
            product_id: params.productId,
            warehouse_id: params.warehouseId,
            company_id: stock.company_id || uuidv4(), // Fallback
            quantity: params.quantity,
            expiry_date: params.expiryDate || null,
            source_type: params.sourceType || 'OPENING',
            batch_number: `BATCH-${Date.now()}`,
        });

        const savedLot = await this.lotRepo.save(lot);

        // Update stock aggregate
        const totalQty = await this.calculateTotalLotQuantity(
            params.warehouseId,
            params.productId,
        );
        stock.quantity = totalQty;
        await this.stockRepo.save(stock);

        return savedLot;
    }

    /**
     * Reduce lot quantity (simulates consumption)
     */
    async reduceLotQuantity(
        lotId: string,
        reduceBy: number,
    ): Promise<StockLot> {
        const lot = await this.lotRepo.findOne({ where: { id: lotId } });
        if (!lot) throw new Error('Lot not found');

        lot.quantity = parseFloat(lot.quantity.toString()) - reduceBy;
        const savedLot = await this.lotRepo.save(lot);

        // Update stock aggregate
        const totalQty = await this.calculateTotalLotQuantity(
            lot.warehouse_id,
            lot.product_id,
        );

        const stock = await this.stockRepo.findOne({
            where: {
                warehouse_id: lot.warehouse_id,
                product_id: lot.product_id,
            },
        });

        if (stock) {
            stock.quantity = totalQty;
            await this.stockRepo.save(stock);
        }

        return savedLot;
    }

    /**
     * Delete a lot (and update aggregate)
     */
    async deleteLot(lotId: string): Promise<void> {
        const lot = await this.lotRepo.findOne({ where: { id: lotId } });
        if (!lot) return;

        await this.lotRepo.remove(lot);

        // Update stock aggregate
        const totalQty = await this.calculateTotalLotQuantity(
            lot.warehouse_id,
            lot.product_id,
        );

        const stock = await this.stockRepo.findOne({
            where: {
                warehouse_id: lot.warehouse_id,
                product_id: lot.product_id,
            },
        });

        if (stock) {
            stock.quantity = totalQty;
            await this.stockRepo.save(stock);
        }
    }

    /**
     * Helper: Calculate total lot quantity
     */
    private async calculateTotalLotQuantity(
        warehouseId: string,
        productId: string,
    ): Promise<number> {
        const lots = await this.lotRepo.find({
            where: {
                warehouse_id: warehouseId,
                product_id: productId,
            },
        });

        return lots.reduce(
            (sum, lot) => sum + parseFloat(lot.quantity.toString()),
            0,
        );
    }
}
