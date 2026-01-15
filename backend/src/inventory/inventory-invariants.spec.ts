import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Stock } from '../src/inventory/entities/stock.entity';
import { StockLot } from '../src/inventory/entities/stock-lot.entity';
import { Product } from '../src/inventory/entities/product.entity';
import { Category } from '../src/inventory/entities/category.entity';
import { Warehouse } from '../src/warehouse/warehouse.entity';
import { Company } from '../src/company/company.entity';
import { testDatabaseConfig } from './test-config';
import { MinimalTestFactory } from './factories/minimal-test.factory';
import { InventoryAssertions } from './helpers/inventory-assertions';

/**
 * CRITICAL INVARIANT TESTS
 * 
 * These tests lock the core guarantees of the inventory system:
 * 1. stock.quantity MUST ALWAYS equal sum(stock_lots.quantity)
 * 2. Stock aggregate cannot exist without at least one lot
 * 3. Lot quantities can never be negative
 * 
 * These invariants protect against:
 * - Silent data drift
 * - Partial updates
 * - Transaction bugs
 * - Manual aggregate manipulation
 */
describe('Inventory Invariants (CRITICAL)', () => {
    let app: INestApplication;
    let module: TestingModule;
    let factory: MinimalTestFactory;

    // Repositories
    let companyRepo: Repository<Company>;
    let warehouseRepo: Repository<Warehouse>;
    let productRepo: Repository<Product>;
    let categoryRepo: Repository<Category>;
    let stockRepo: Repository<Stock>;
    let lotRepo: Repository<StockLot>;

    // Test data
    let company: Company;
    let warehouse: Warehouse;
    let category: Category;
    let product: Product;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(testDatabaseConfig),
                TypeOrmModule.forFeature([
                    Company,
                    Warehouse,
                    Product,
                    Category,
                    Stock,
                    StockLot,
                ]),
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        // Get repositories
        companyRepo = module.get('CompanyRepository');
        warehouseRepo = module.get('WarehouseRepository');
        productRepo = module.get('ProductRepository');
        categoryRepo = module.get('CategoryRepository');
        stockRepo = module.get('StockRepository');
        lotRepo = module.get('StockLotRepository');

        // Initialize factory
        factory = new MinimalTestFactory(
            companyRepo,
            warehouseRepo,
            productRepo,
            categoryRepo,
            stockRepo,
            lotRepo,
        );

        // Create base test data
        company = await factory.createCompany();
        warehouse = await factory.createWarehouse(company.id);
        category = await factory.createCategory(company.id);
        product = await factory.createProduct(company.id, category.id);
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * INVARIANT 1: stock.quantity === SUM(stock_lots.quantity)
     * 
     * This is THE most critical invariant. If this breaks, the entire
     * inventory system is compromised.
     */
    describe('Invariant 1: Stock equals sum of lots', () => {
        it('should maintain equality when creating multiple lots', async () => {
            // Create lot 1: 50 units
            const lot1 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: product.id,
                quantity: 50,
            });

            // Get stock
            const stock1 = await stockRepo.findOne({
                where: {
                    warehouse_id: warehouse.id,
                    product_id: product.id,
                },
            });

            expect(stock1).toBeDefined();
            expect(parseFloat(stock1!.quantity.toString())).toBe(50);

            // Create lot 2: 30 units
            const lot2 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: product.id,
                quantity: 30,
            });

            // Create lot 3: 20 units
            const lot3 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: product.id,
                quantity: 20,
            });

            // Verify: stock should be 100
            const stock2 = await stockRepo.findOne({
                where: {
                    warehouse_id: warehouse.id,
                    product_id: product.id,
                },
            });

            expect(parseFloat(stock2!.quantity.toString())).toBe(100);

            // Verify with assertion helper
            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock2!.id,
            );
        });

        it('should maintain equality after lot consumption (reduction)', async () => {
            // Create fresh product for this test
            const testProduct = await factory.createProduct(
                company.id,
                category.id,
                { name: 'Consumption Test Product' },
            );

            // Create initial lot: 100 units
            const lot = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 100,
            });

            // Get initial stock
            const stock = await stockRepo.findOne({
                where: {
                    warehouse_id: warehouse.id,
                    product_id: testProduct.id,
                },
            });

            expect(parseFloat(stock!.quantity.toString())).toBe(100);

            // Reduce lot by 40 units (simulates FEFO consumption)
            await factory.reduceLotQuantity(lot.id, 40);

            // Verify: stock should be 60
            const stock2 = await stockRepo.findOne({
                where: { id: stock!.id },
            });

            expect(parseFloat(stock2!.quantity.toString())).toBe(60);

            // Verify invariant
            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock2!.id,
            );
        });

        it('should maintain equality after deleting a lot', async () => {
            // Create fresh product
            const testProduct = await factory.createProduct(
                company.id,
                category.id,
                { name: 'Deletion Test Product' },
            );

            // Create 3 lots
            const lot1 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 50,
            });

            const lot2 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 30,
            });

            const lot3 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 20,
            });

            // Initial stock: 100
            const stock = await stockRepo.findOne({
                where: {
                    warehouse_id: warehouse.id,
                    product_id: testProduct.id,
                },
            });

            expect(parseFloat(stock!.quantity.toString())).toBe(100);

            // Delete lot2 (30 units)
            await factory.deleteLot(lot2.id);

            // Stock should now be 70
            const stock2 = await stockRepo.findOne({
                where: { id: stock!.id },
            });

            expect(parseFloat(stock2!.quantity.toString())).toBe(70);

            // Verify invariant
            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock2!.id,
            );
        });
    });

    /**
     * INVARIANT 2: Lot quantities can never be negative
     * 
     * Prevents over-consumption bugs
     */
    describe('Invariant 2: No negative lot quantities', () => {
        it('should prevent negative quantities', async () => {
            const testProduct = await factory.createProduct(
                company.id,
                category.id,
                { name: 'Negative Test Product' },
            );

            const lot = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 50,
            });

            // Attempt to reduce by more than available
            await expect(
                factory.reduceLotQuantity(lot.id, 60),
            ).rejects.toThrow();

            // Lot quantity should still be 50
            const lot2 = await lotRepo.findOne({ where: { id: lot.id } });
            expect(parseFloat(lot2!.quantity.toString())).toBe(50);
        });
    });

    /**
     * INVARIANT 3: Stock aggregate reflects reality
     * 
     * No drift between aggregate and source of truth (lots)
     */
    describe('Invariant 3: No aggregate drift', () => {
        it('should keep aggregate in sync across multiple operations', async () => {
            const testProduct = await factory.createProduct(
                company.id,
                category.id,
                { name: 'Drift Test Product' },
            );

            // Operation 1: Add 50
            await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 50,
            });

            const stock = await stockRepo.findOne({
                where: {
                    warehouse_id: warehouse.id,
                    product_id: testProduct.id,
                },
            });

            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock!.id,
            );

            // Operation 2: Add 30
            await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 30,
            });

            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock!.id,
            );

            // Operation 3: Add 20
            const lot3 = await factory.createStockLot({
                warehouseId: warehouse.id,
                productId: testProduct.id,
                quantity: 20,
            });

            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock!.id,
            );

            // Operation 4: Reduce lot
            await factory.reduceLotQuantity(lot3.id, 10);

            await InventoryAssertions.assertStockLotsInvariant(
                stockRepo,
                lotRepo,
                stock!.id,
            );

            // Final verification
            const finalStock = await stockRepo.findOne({
                where: { id: stock!.id },
            });

            // 50 + 30 + (20-10) = 90
            expect(parseFloat(finalStock!.quantity.toString())).toBe(90);
        });
    });
});
