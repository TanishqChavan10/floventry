import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../inventory/entities/product.entity';
import { Category } from '../inventory/entities/category.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Unit } from '../inventory/entities/unit.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { LotSourceType } from '../inventory/entities/stock-lot.entity';
import { MovementType, ReferenceType } from '../inventory/entities/stock-movement.entity';
import * as Papa from 'papaparse';

export interface ValidationError {
    rowNumber: number;
    field: string;
    message: string;
}

export interface ValidatedRow {
    rowNumber: number;
    data: any;
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationResult {
    validRows: ValidatedRow[];
    errorRows: ValidatedRow[];
    totalRows: number;
}

export interface ImportResult {
    successCount: number;
    failureCount: number;
    errors: ValidationError[];
}

@Injectable()
export class ImportService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Supplier)
        private supplierRepository: Repository<Supplier>,
        @InjectRepository(Unit)
        private unitRepository: Repository<Unit>,
        @InjectRepository(StockLot)
        private stockLotRepository: Repository<StockLot>,
        @InjectRepository(Stock)
        private stockRepository: Repository<Stock>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        private dataSource: DataSource,
    ) { }

    /**
     * Generate CSV template for products
     */
    generateProductTemplate(): string {
        const template = [
            {
                sku: 'PROD-001',
                name: 'Example Product',
                barcode: '1234567890123',
                category: 'Electronics',
                supplier: 'ABC Suppliers Ltd',
                unit: 'pcs',
                cost_price: '100.00',
                selling_price: '150.00',
                image_url: 'https://example.com/image.jpg',
                description: 'Product description',
                min_stock_level: '10',
                reorder_point: '20',
                max_stock_level: '100',
            },
        ];
        return Papa.unparse(template);
    }

    /**
     * Generate CSV template for categories
     */
    generateCategoryTemplate(): string {
        const template = [
            {
                name: 'Electronics',
                description: 'Electronic items and gadgets',
            },
            {
                name: 'Furniture',
                description: 'Office and home furniture',
            },
        ];
        return Papa.unparse(template);
    }

    /**
     * Generate CSV template for suppliers
     */
    generateSupplierTemplate(): string {
        const template = [
            {
                name: 'ABC Suppliers Ltd',
                contact_person: 'John Doe',
                email: 'john@abcsuppliers.com',
                phone: '+91-9876543210',
                address: '123 Business Street, Mumbai',
            },
        ];
        return Papa.unparse(template);
    }

    /**
     * Generate CSV template for opening stock
     */
    generateOpeningStockTemplate(): string {
        const template = [
            {
                sku: 'PROD-001',
                quantity: '50',
                expiry_date: '2026-12-31',
            },
        ];
        return Papa.unparse(template);
    }

    /**
     * Validate product import
     */
    async validateProductImport(
        csvContent: string,
        companyId: string,
    ): Promise<ValidationResult> {
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];

        const validRows: ValidatedRow[] = [];
        const errorRows: ValidatedRow[] = [];

        // Get existing SKUs to check for duplicates
        const existingProducts = await this.productRepository.find({
            where: { company_id: companyId },
            select: ['sku'],
        });
        const existingSKUs = new Set(existingProducts.map((p) => p.sku));

        // Get existing units to validate references
        const existingUnits = await this.unitRepository.find({
            where: { company_id: companyId },
            select: ['shortCode', 'name'],
        });
        // Create a set that includes both short codes and names for flexible matching
        const validUnitIdentifiers = new Set<string>();
        existingUnits.forEach(u => {
            validUnitIdentifiers.add(u.shortCode.toLowerCase());
            validUnitIdentifiers.add(u.name.toLowerCase());
        });

        // Get existing suppliers to validate references (optional field)
        const existingSuppliers = await this.supplierRepository.find({
            where: { company_id: companyId },
            select: ['name'],
        });
        const supplierNames = new Set(existingSuppliers.map(s => s.name.toLowerCase()));

        // Get existing categories to validate references (optional field)
        const existingCategories = await this.categoryRepository.find({
            where: { company_id: companyId },
            select: ['name'],
        });
        const categoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 because of header row and 0-based index
            const errors: ValidationError[] = [];

            // Validate SKU
            if (!row.sku || row.sku.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'sku',
                    message: 'SKU is required',
                });
            } else if (existingSKUs.has(row.sku)) {
                errors.push({
                    rowNumber,
                    field: 'sku',
                    message: `Duplicate SKU: ${row.sku} already exists`,
                });
            }

            // Validate name
            if (!row.name || row.name.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: 'Product name is required',
                });
            }

            // Validate unit (required)
            if (!row.unit || row.unit.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'unit',
                    message: 'Unit is required',
                });
            } else if (!validUnitIdentifiers.has(row.unit.toLowerCase())) {
                errors.push({
                    rowNumber,
                    field: 'unit',
                    message: `Unit "${row.unit}" does not exist. Please create it first.`,
                });
            }

            // Validate supplier exists (if provided)
            if (row.supplier && row.supplier.trim() !== '') {
                if (!supplierNames.has(row.supplier.toLowerCase())) {
                    errors.push({
                        rowNumber,
                        field: 'supplier',
                        message: `Supplier "${row.supplier}" does not exist. Please create it first.`,
                    });
                }
            }

            // Validate category exists (if provided)
            if (row.category && row.category.trim() !== '') {
                if (!categoryNames.has(row.category.toLowerCase())) {
                    errors.push({
                        rowNumber,
                        field: 'category',
                        message: `Category "${row.category}" does not exist. Please create it first.`,
                    });
                }
            }

            // Validate price fields if provided
            if (row.cost_price && isNaN(Number(row.cost_price))) {
                errors.push({
                    rowNumber,
                    field: 'cost_price',
                    message: 'Cost price must be a number',
                });
            }

            if (row.selling_price && isNaN(Number(row.selling_price))) {
                errors.push({
                    rowNumber,
                    field: 'selling_price',
                    message: 'Selling price must be a number',
                });
            }

            // Validate numeric fields if provided
            if (row.min_stock_level && isNaN(Number(row.min_stock_level))) {
                errors.push({
                    rowNumber,
                    field: 'min_stock_level',
                    message: 'Min stock level must be a number',
                });
            }

            if (row.reorder_point && isNaN(Number(row.reorder_point))) {
                errors.push({
                    rowNumber,
                    field: 'reorder_point',
                    message: 'Reorder point must be a number',
                });
            }

            if (row.max_stock_level && isNaN(Number(row.max_stock_level))) {
                errors.push({
                    rowNumber,
                    field: 'max_stock_level',
                    message: 'Max stock level must be a number',
                });
            }

            const validatedRow: ValidatedRow = {
                rowNumber,
                data: row,
                isValid: errors.length === 0,
                errors,
            };

            if (validatedRow.isValid) {
                validRows.push(validatedRow);
            } else {
                errorRows.push(validatedRow);
            }
        }

        return {
            validRows,
            errorRows,
            totalRows: rows.length,
        };
    }

    /**
     * Execute product import
     */
    async executeProductImport(
        validatedRows: ValidatedRow[],
        companyId: string,
    ): Promise<ImportResult> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let successCount = 0;
        const errors: ValidationError[] = [];

        try {
            for (const row of validatedRows) {
                try {
                    // Find category (validation ensures it exists if provided)
                    let category: Category | null = null;
                    if (row.data.category) {
                        category = await queryRunner.manager.findOne(Category, {
                            where: { name: row.data.category, company_id: companyId },
                        });
                    }

                    // Find supplier (validation ensures it exists if provided)
                    let supplier: Supplier | null = null;
                    if (row.data.supplier) {
                        supplier = await queryRunner.manager.findOne(Supplier, {
                            where: { name: row.data.supplier, company_id: companyId },
                        });
                    }

                    // Find unit by either shortCode or name (validation ensures it exists)
                    let unitValue = row.data.unit;
                    const unit = await queryRunner.manager.findOne(this.unitRepository.target as any, {
                        where: [
                            { shortCode: row.data.unit, company_id: companyId },
                            { name: row.data.unit, company_id: companyId },
                        ],
                    });

                    // Use the shortCode for storage (consistent format)
                    if (unit && (unit as any).shortCode) {
                        unitValue = (unit as any).shortCode;
                    }

                    // Create product
                    const product = queryRunner.manager.create(Product, {
                        company_id: companyId,
                        category_id: category?.id || undefined,
                        supplier_id: supplier?.id || undefined,
                        sku: row.data.sku,
                        name: row.data.name,
                        barcode: row.data.barcode || null,
                        unit: unitValue,
                        cost_price: row.data.cost_price ? parseFloat(row.data.cost_price) : null,
                        selling_price: row.data.selling_price ? parseFloat(row.data.selling_price) : null,
                        image_url: row.data.image_url || null,
                        description: row.data.description || null,
                    } as any);

                    await queryRunner.manager.save(product);
                    successCount++;
                } catch (error: any) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        field: 'general',
                        message: error.message,
                    });
                }
            }

            await queryRunner.commitTransaction();
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Import failed: ' + error.message);
        } finally {
            await queryRunner.release();
        }

        return {
            successCount,
            failureCount: validatedRows.length - successCount,
            errors,
        };
    }

    /**
     * Validate category import
     */
    async validateCategoryImport(
        csvContent: string,
        companyId: string,
    ): Promise<ValidationResult> {
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];

        const validRows: ValidatedRow[] = [];
        const errorRows: ValidatedRow[] = [];

        // Get existing categories
        const existingCategories = await this.categoryRepository.find({
            where: { company_id: companyId },
            select: ['name'],
        });
        const existingNames = new Set(existingCategories.map((c) => c.name));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;
            const errors: ValidationError[] = [];

            // Validate name
            if (!row.name || row.name.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: 'Category name is required',
                });
            } else if (existingNames.has(row.name)) {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: `Duplicate category: ${row.name} already exists`,
                });
            }

            const validatedRow: ValidatedRow = {
                rowNumber,
                data: row,
                isValid: errors.length === 0,
                errors,
            };

            if (validatedRow.isValid) {
                validRows.push(validatedRow);
            } else {
                errorRows.push(validatedRow);
            }
        }

        return {
            validRows,
            errorRows,
            totalRows: rows.length,
        };
    }

    /**
     * Execute category import
     */
    async executeCategoryImport(
        validatedRows: ValidatedRow[],
        companyId: string,
    ): Promise<ImportResult> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let successCount = 0;
        const errors: ValidationError[] = [];

        try {
            for (const row of validatedRows) {
                try {
                    const category = queryRunner.manager.create(Category, {
                        company_id: companyId,
                        name: row.data.name,
                        description: row.data.description || null,
                    });

                    await queryRunner.manager.save(category);
                    successCount++;
                } catch (error: any) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        field: 'general',
                        message: error.message,
                    });
                }
            }

            await queryRunner.commitTransaction();
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Import failed: ' + error.message);
        } finally {
            await queryRunner.release();
        }

        return {
            successCount,
            failureCount: validatedRows.length - successCount,
            errors,
        };
    }

    /**
     * Validate supplier import
     */
    async validateSupplierImport(
        csvContent: string,
        companyId: string,
    ): Promise<ValidationResult> {
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];

        const validRows: ValidatedRow[] = [];
        const errorRows: ValidatedRow[] = [];

        // Get existing suppliers
        const existingSuppliers = await this.supplierRepository.find({
            where: { company_id: companyId },
            select: ['name', 'email'],
        });
        const existingNames = new Set(existingSuppliers.map((s) => s.name));
        const existingEmails = new Set(
            existingSuppliers.map((s) => s.email).filter(Boolean),
        );

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;
            const errors: ValidationError[] = [];

            // Validate name
            if (!row.name || row.name.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: 'Supplier name is required',
                });
            } else if (existingNames.has(row.name)) {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: `Duplicate supplier: ${row.name} already exists`,
                });
            }

            // Validate email if provided
            if (row.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row.email)) {
                    errors.push({
                        rowNumber,
                        field: 'email',
                        message: 'Invalid email format',
                    });
                } else if (existingEmails.has(row.email)) {
                    errors.push({
                        rowNumber,
                        field: 'email',
                        message: `Email ${row.email} already exists`,
                    });
                }
            }

            const validatedRow: ValidatedRow = {
                rowNumber,
                data: row,
                isValid: errors.length === 0,
                errors,
            };

            if (validatedRow.isValid) {
                validRows.push(validatedRow);
            } else {
                errorRows.push(validatedRow);
            }
        }

        return {
            validRows,
            errorRows,
            totalRows: rows.length,
        };
    }

    /**
     * Execute supplier import
     */
    async executeSupplierImport(
        validatedRows: ValidatedRow[],
        companyId: string,
    ): Promise<ImportResult> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let successCount = 0;
        const errors: ValidationError[] = [];

        try {
            for (const row of validatedRows) {
                try {
                    const supplier = queryRunner.manager.create(Supplier, {
                        company_id: companyId,
                        name: row.data.name,
                        contact_person: row.data.contact_person || null,
                        email: row.data.email || null,
                        phone: row.data.phone || null,
                        address: row.data.address || null,
                    });

                    await queryRunner.manager.save(supplier);
                    successCount++;
                } catch (error: any) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        field: 'general',
                        message: error.message,
                    });
                }
            }

            await queryRunner.commitTransaction();
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Import failed: ' + error.message);
        } finally {
            await queryRunner.release();
        }

        return {
            successCount,
            failureCount: validatedRows.length - successCount,
            errors,
        };
    }

    /**
     * Validate opening stock import
     */
    async validateOpeningStockImport(
        csvContent: string,
        warehouseId: string,
        companyId: string,
    ): Promise<ValidationResult> {
        // Ensure warehouse belongs to company (prevents cross-company imports)
        const warehouse = await this.dataSource.getRepository(Warehouse).findOne({
            where: { id: warehouseId, company_id: companyId },
            select: ['id'],
        });

        if (!warehouse) {
            throw new BadRequestException('Warehouse not found or does not belong to your company');
        }

        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];

        const validRows: ValidatedRow[] = [];
        const errorRows: ValidatedRow[] = [];

        // Get all products for this company
        const products = await this.productRepository.find({
            where: { company_id: companyId },
        });
        const productMap = new Map(products.map((p) => [p.sku, p]));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;
            const errors: ValidationError[] = [];

            // Validate SKU exists
            if (!row.sku || row.sku.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'sku',
                    message: 'SKU is required',
                });
            } else if (!productMap.has(row.sku)) {
                errors.push({
                    rowNumber,
                    field: 'sku',
                    message: `Unknown product SKU: ${row.sku}`,
                });
            }

            // Validate quantity
            if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
                errors.push({
                    rowNumber,
                    field: 'quantity',
                    message: 'Quantity must be a positive number',
                });
            }

            // Validate expiry date if provided
            if (row.expiry_date) {
                const expiryDate = new Date(row.expiry_date);
                if (isNaN(expiryDate.getTime())) {
                    errors.push({
                        rowNumber,
                        field: 'expiry_date',
                        message: 'Invalid expiry date format (use YYYY-MM-DD)',
                    });
                } else if (expiryDate < new Date()) {
                    errors.push({
                        rowNumber,
                        field: 'expiry_date',
                        message: 'Expiry date cannot be in the past',
                    });
                }
            }

            const validatedRow: ValidatedRow = {
                rowNumber,
                data: row,
                isValid: errors.length === 0,
                errors,
            };

            if (validatedRow.isValid) {
                validRows.push(validatedRow);
            } else {
                errorRows.push(validatedRow);
            }
        }

        return {
            validRows,
            errorRows,
            totalRows: rows.length,
        };
    }

    /**
     * Execute opening stock import
     */
    async executeOpeningStockImport(
        validatedRows: ValidatedRow[],
        warehouseId: string,
        companyId: string,
        userId: string,
    ): Promise<ImportResult> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let successCount = 0;
        const errors: ValidationError[] = [];

        try {
            // Ensure warehouse belongs to company
            const warehouse = await queryRunner.manager.findOne(Warehouse, {
                where: { id: warehouseId, company_id: companyId },
                select: ['id'],
            });

            if (!warehouse) {
                throw new BadRequestException('Warehouse not found or does not belong to your company');
            }

            // Get products
            const products = await queryRunner.manager.find(Product, {
                where: { company_id: companyId },
            });
            const productMap = new Map(products.map((p) => [p.sku, p]));

            for (const row of validatedRows) {
                try {
                    const product = productMap.get(row.data.sku);
                    if (!product) continue;

                    const quantity = Number(row.data.quantity);
                    const expiryDate = row.data.expiry_date
                        ? new Date(row.data.expiry_date)
                        : null;

                    // Create stock lot
                    const lot = queryRunner.manager.create(StockLot, {
                        company_id: companyId,
                        warehouse_id: warehouseId,
                        product_id: product.id,
                        quantity,
                        expiry_date: expiryDate,
                        received_at: new Date(),
                        source_type: LotSourceType.OPENING,
                        source_id: null,
                    } as any);
                    await queryRunner.manager.save(lot);

                    // Update or create stock aggregate
                    let stock = await queryRunner.manager.findOne(Stock, {
                        where: {
                            company_id: companyId,
                            warehouse_id: warehouseId,
                            product_id: product.id,
                        },
                    });

                    const previousQuantity = stock ? Number(stock.quantity) : 0;
                    const newQuantity = previousQuantity + quantity;

                    if (stock) {
                        stock.quantity = newQuantity;
                        await queryRunner.manager.save(stock);
                    } else {
                        stock = queryRunner.manager.create(Stock, {
                            company_id: companyId,
                            warehouse_id: warehouseId,
                            product_id: product.id,
                            quantity,
                        });
                        await queryRunner.manager.save(stock);
                    }

                    // Create stock movement
                    const movement = queryRunner.manager.create(StockMovement, {
                        stock_id: stock.id,
                        warehouse_id: warehouseId,
                        company_id: companyId,
                        product_id: product.id,
                        lot_id: lot.id,
                        type: MovementType.OPENING,
                        quantity,
                        previous_quantity: previousQuantity,
                        new_quantity: newQuantity,
                        reason: 'Opening stock import',
                        reference_type: ReferenceType.MANUAL,
                        reference_id: 'OPENING_STOCK_IMPORT',
                        performed_by: userId,
                    } as any);
                    await queryRunner.manager.save(movement);

                    successCount++;
                } catch (error: any) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        field: 'general',
                        message: error.message,
                    });
                }
            }

            await queryRunner.commitTransaction();
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Import failed: ' + error.message);
        } finally {
            await queryRunner.release();
        }

        return {
            successCount,
            failureCount: validatedRows.length - successCount,
            errors,
        };
    }

    /**
     * Generate CSV template for units
     */
    generateUnitTemplate(): string {
        const template = [
            {
                name: 'Piece',
                shortCode: 'pcs',
                isDefault: 'false',
            },
            {
                name: 'Kilogram',
                shortCode: 'kg',
                isDefault: 'false',
            },
        ];
        return Papa.unparse(template);
    }

    /**
     * Validate unit import
     */
    async validateUnitImport(
        csvContent: string,
        companyId: string,
    ): Promise<ValidationResult> {
        const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
        const rows = parsed.data as any[];

        const validRows: ValidatedRow[] = [];
        const errorRows: ValidatedRow[] = [];

        // Get existing units
        const existingUnits = await this.unitRepository.find({
            where: { company_id: companyId },
            select: ['name', 'shortCode'],
        });
        const existingNames = new Set(existingUnits.map((u) => u.name.toLowerCase()));
        const existingShortCodes = new Set(existingUnits.map((u) => u.shortCode.toLowerCase()));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;
            const errors: ValidationError[] = [];

            // Validate name
            if (!row.name || row.name.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: 'Unit name is required',
                });
            } else if (existingNames.has(row.name.toLowerCase())) {
                errors.push({
                    rowNumber,
                    field: 'name',
                    message: `Duplicate unit: ${row.name} already exists`,
                });
            }

            // Validate shortCode
            if (!row.shortCode || row.shortCode.trim() === '') {
                errors.push({
                    rowNumber,
                    field: 'shortCode',
                    message: 'Short code is required',
                });
            } else if (existingShortCodes.has(row.shortCode.toLowerCase())) {
                errors.push({
                    rowNumber,
                    field: 'shortCode',
                    message: `Duplicate short code: ${row.shortCode} already exists`,
                });
            }

            // Validate isDefault if provided
            if (row.isDefault && row.isDefault !== '') {
                const normalizedValue = row.isDefault.toLowerCase();
                if (!['true', 'false', 'yes', 'no', '1', '0'].includes(normalizedValue)) {
                    errors.push({
                        rowNumber,
                        field: 'isDefault',
                        message: 'isDefault must be true, false, yes, no, 1, or 0',
                    });
                }
            }

            const validatedRow: ValidatedRow = {
                rowNumber,
                data: row,
                isValid: errors.length === 0,
                errors,
            };

            if (validatedRow.isValid) {
                validRows.push(validatedRow);
            } else {
                errorRows.push(validatedRow);
            }
        }

        return {
            validRows,
            errorRows,
            totalRows: rows.length,
        };
    }

    /**
     * Execute unit import
     */
    async executeUnitImport(
        validatedRows: ValidatedRow[],
        companyId: string,
    ): Promise<ImportResult> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let successCount = 0;
        const errors: ValidationError[] = [];

        try {
            // Check if any of the rows being imported should be set as default
            const hasDefaultInImport = validatedRows.some(row => {
                const normalizedValue = (row.data.isDefault || '').toLowerCase();
                return ['true', 'yes', '1'].includes(normalizedValue);
            });

            // If we're importing a default unit, unset any existing default
            if (hasDefaultInImport) {
                await queryRunner.manager.update(
                    Unit,
                    { company_id: companyId, isDefault: true },
                    { isDefault: false }
                );
            }

            for (const row of validatedRows) {
                try {
                    // Parse isDefault value
                    const normalizedValue = (row.data.isDefault || 'false').toLowerCase();
                    const isDefault = ['true', 'yes', '1'].includes(normalizedValue);

                    const unit = queryRunner.manager.create(Unit, {
                        company_id: companyId,
                        name: row.data.name,
                        shortCode: row.data.shortCode,
                        isDefault,
                    });

                    await queryRunner.manager.save(unit);
                    successCount++;
                } catch (error: any) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        field: 'general',
                        message: error.message,
                    });
                }
            }

            await queryRunner.commitTransaction();
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Import failed: ' + error.message);
        } finally {
            await queryRunner.release();
        }

        return {
            successCount,
            failureCount: validatedRows.length - successCount,
            errors,
        };
    }
}

