import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import * as Papa from 'papaparse';
import { normalizeExpiryToEndOfDayUTC } from '../common/utils/expiry-date';

export interface ExportFilters {
    dateFrom?: string;
    dateTo?: string;
    productIds?: string[];
    warehouseIds?: string[];
}

@Injectable()
export class ExportService {
    constructor(
        @InjectRepository(Stock)
        private stockRepository: Repository<Stock>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        @InjectRepository(StockLot)
        private stockLotRepository: Repository<StockLot>,
    ) { }

    /**
     * Export current stock snapshot for a warehouse
     */
    async exportStockSnapshot(
        warehouseId: string,
        filters?: ExportFilters,
        companyId?: string,
    ): Promise<string> {
        const query = this.stockRepository
            .createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('stock.warehouse', 'warehouse')
            .where('stock.warehouse_id = :warehouseId', { warehouseId });

        if (companyId) {
            query.andWhere('stock.company_id = :companyId', { companyId });
        }

        if (filters?.productIds?.length) {
            query.andWhere('stock.product_id IN (:...productIds)', {
                productIds: filters.productIds,
            });
        }

        const stocks = await query.getMany();

        const csvData = stocks.map((stock) => ({
            'Product SKU': stock.product?.sku || '',
            'Product Name': stock.product?.name || '',
            'Warehouse': stock.warehouse?.name || '',
            'Quantity': stock.quantity,
            'Unit': stock.product?.unit || '',
            'Min Stock Level': stock.min_stock_level || 0,
            'Reorder Point': stock.reorder_point || 0,
            'Max Stock Level': stock.max_stock_level || 0,
            'Status':
                stock.quantity < (stock.min_stock_level || 0)
                    ? 'Critical'
                    : stock.quantity < (stock.reorder_point || 0)
                        ? 'Low Stock'
                        : 'OK',
        }));

        return Papa.unparse(csvData);
    }

    /**
     * Export stock movements for a warehouse
     */
    async exportStockMovements(
        warehouseId: string,
        filters?: ExportFilters,
        companyId?: string,
    ): Promise<string> {
        const query = this.stockMovementRepository
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.warehouse', 'warehouse')
            .leftJoinAndSelect('movement.lot', 'lot')
            .where('movement.warehouse_id = :warehouseId', { warehouseId })
            .orderBy('movement.created_at', 'DESC');

        if (companyId) {
            query.andWhere('movement.company_id = :companyId', { companyId });
        }

        if (filters?.dateFrom) {
            query.andWhere('movement.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }

        if (filters?.dateTo) {
            query.andWhere('movement.created_at <= :dateTo', {
                dateTo: filters.dateTo,
            });
        }

        if (filters?.productIds?.length) {
            query.andWhere('movement.product_id IN (:...productIds)', {
                productIds: filters.productIds,
            });
        }

        const movements = await query.getMany();

        const csvData = movements.map((movement) => ({
            'Date': new Date(movement.created_at).toLocaleDateString(),
            'Movement Type': movement.type,
            'Product SKU': movement.product?.sku || '',
            'Product Name': movement.product?.name || '',
            'Warehouse': movement.warehouse?.name || '',
            'Quantity': movement.quantity,
            'Unit': movement.product?.unit || '',
            'Reference Type': movement.reference_type || '',
            'Reference ID': movement.reference_id || '',
            'Batch/Lot': movement.lot?.id?.slice(0, 8) || 'N/A',
            'Performed By': movement.performed_by || '',
        }));

        return Papa.unparse(csvData);
    }

    /**
     * Export adjustments (IN/OUT movements) for a warehouse
     */
    async exportAdjustments(
        warehouseId: string,
        filters?: ExportFilters,
        companyId?: string,
    ): Promise<string> {
        const query = this.stockMovementRepository
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.warehouse', 'warehouse')
            .where('movement.warehouse_id = :warehouseId', { warehouseId })
            .andWhere('movement.type IN (:...types)', {
                types: ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT'],
            })
            .orderBy('movement.created_at', 'DESC');

        if (companyId) {
            query.andWhere('movement.company_id = :companyId', { companyId });
        }

        if (filters?.dateFrom) {
            query.andWhere('movement.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }

        if (filters?.dateTo) {
            query.andWhere('movement.created_at <= :dateTo', {
                dateTo: filters.dateTo,
            });
        }

        const movements = await query.getMany();

        const csvData = movements.map((movement) => ({
            'Date': new Date(movement.created_at).toLocaleDateString(),
            'Type': movement.type === 'ADJUSTMENT_IN' ? 'IN' : 'OUT',
            'Product SKU': movement.product?.sku || '',
            'Product Name': movement.product?.name || '',
            'Warehouse': movement.warehouse?.name || '',
            'Quantity': Math.abs(movement.quantity),
            'Unit': movement.product?.unit || '',
            'Reason': movement.notes || '',
            'Performed By': movement.performed_by || '',
        }));

        return Papa.unparse(csvData);
    }

    /**
     * Export expiry lots for a warehouse
     */
    async exportExpiryLots(
        warehouseId: string,
        filters?: ExportFilters,
        companyId?: string,
    ): Promise<string> {
        const query = this.stockLotRepository
            .createQueryBuilder('lot')
            .leftJoinAndSelect('lot.product', 'product')
            .leftJoinAndSelect('lot.warehouse', 'warehouse')
            .where('lot.warehouse_id = :warehouseId', { warehouseId })
            .andWhere('lot.quantity > 0')
            .orderBy('lot.expiry_date', 'ASC', 'NULLS LAST');

        if (companyId) {
            query.andWhere('lot.company_id = :companyId', { companyId });
        }

        if (filters?.productIds?.length) {
            query.andWhere('lot.product_id IN (:...productIds)', {
                productIds: filters.productIds,
            });
        }

        const lots = await query.getMany();

        const now = new Date();
        const csvData = lots.map((lot) => {
            let status = 'OK';
            let daysUntilExpiry: number | null = null;

            if (lot.expiry_date) {
                daysUntilExpiry = Math.ceil(
                    (normalizeExpiryToEndOfDayUTC(new Date(lot.expiry_date)).getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                if (daysUntilExpiry < 0) {
                    status = 'EXPIRED';
                } else if (daysUntilExpiry <= 30) {
                    status = 'EXPIRING SOON';
                }
            }

            return {
                'Product SKU': lot.product?.sku || '',
                'Product Name': lot.product?.name || '',
                'Warehouse': lot.warehouse?.name || '',
                'Lot ID': lot.id.slice(0, 8),
                'Quantity': lot.quantity,
                'Unit': lot.product?.unit || '',
                'Expiry Date': lot.expiry_date
                    ? new Date(lot.expiry_date).toLocaleDateString()
                    : 'No Expiry',
                'Days Until Expiry': daysUntilExpiry !== null ? daysUntilExpiry : 'N/A',
                'Status': status,
                'Received Date': new Date(lot.received_at).toLocaleDateString(),
                'Source': lot.source_type,
            };
        });

        return Papa.unparse(csvData);
    }

    /**
     * Export company-wide inventory summary
     */
    async exportInventorySummary(
        companyId: string,
        filters?: ExportFilters,
    ): Promise<string> {
        const query = this.stockRepository
            .createQueryBuilder('stock')
            .leftJoinAndSelect('stock.product', 'product')
            .leftJoinAndSelect('stock.warehouse', 'warehouse')
            .where('stock.company_id = :companyId', { companyId });

        if (filters?.warehouseIds?.length) {
            query.andWhere('stock.warehouse_id IN (:...warehouseIds)', {
                warehouseIds: filters.warehouseIds,
            });
        }

        if (filters?.productIds?.length) {
            query.andWhere('stock.product_id IN (:...productIds)', {
                productIds: filters.productIds,
            });
        }

        const stocks = await query.getMany();

        // Group by product and aggregate across warehouses
        const productMap = new Map<string, any>();

        stocks.forEach((stock) => {
            const key = stock.product_id;
            if (!productMap.has(key)) {
                productMap.set(key, {
                    sku: stock.product?.sku || '',
                    name: stock.product?.name || '',
                    unit: stock.product?.unit || '',
                    totalQuantity: 0,
                    warehouses: [],
                });
            }

            const product = productMap.get(key);
            product.totalQuantity += stock.quantity;
            product.warehouses.push({
                name: stock.warehouse?.name || '',
                quantity: stock.quantity,
            });
        });

        const csvData = Array.from(productMap.values()).map((product) => ({
            'Product SKU': product.sku,
            'Product Name': product.name,
            'Total Quantity': product.totalQuantity,
            'Unit': product.unit,
            'Warehouse Count': product.warehouses.length,
            'Warehouses': product.warehouses
                .map((w: any) => `${w.name} (${w.quantity})`)
                .join('; '),
        }));

        return Papa.unparse(csvData);
    }

    /**
     * Export company-wide stock movements
     */
    async exportCompanyMovements(
        companyId: string,
        filters?: ExportFilters,
    ): Promise<string> {
        const query = this.stockMovementRepository
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.product', 'product')
            .leftJoinAndSelect('movement.warehouse', 'warehouse')
            .where('movement.company_id = :companyId', { companyId })
            .orderBy('movement.created_at', 'DESC');

        if (filters?.dateFrom) {
            query.andWhere('movement.created_at >= :dateFrom', {
                dateFrom: filters.dateFrom,
            });
        }

        if (filters?.dateTo) {
            query.andWhere('movement.created_at <= :dateTo', {
                dateTo: filters.dateTo,
            });
        }

        if (filters?.warehouseIds?.length) {
            query.andWhere('movement.warehouse_id IN (:...warehouseIds)', {
                warehouseIds: filters.warehouseIds,
            });
        }

        const movements = await query.getMany();

        const csvData = movements.map((movement) => ({
            'Date': new Date(movement.created_at).toLocaleDateString(),
            'Warehouse': movement.warehouse?.name || '',
            'Movement Type': movement.type,
            'Product SKU': movement.product?.sku || '',
            'Product Name': movement.product?.name || '',
            'Quantity': movement.quantity,
            'Unit': movement.product?.unit || '',
            'Reference Type': movement.reference_type || '',
            'Performed By': movement.performed_by || '',
        }));

        return Papa.unparse(csvData);
    }

    /**
     * Export expiry risk report (company-wide)
     */
    async exportExpiryRisk(
        companyId: string,
        filters?: ExportFilters,
    ): Promise<string> {
        const query = this.stockLotRepository
            .createQueryBuilder('lot')
            .leftJoinAndSelect('lot.product', 'product')
            .leftJoinAndSelect('lot.warehouse', 'warehouse')
            .where('lot.company_id = :companyId', { companyId })
            .andWhere('lot.quantity > 0')
            .andWhere('lot.expiry_date IS NOT NULL')
            .orderBy('lot.expiry_date', 'ASC');

        if (filters?.warehouseIds?.length) {
            query.andWhere('lot.warehouse_id IN (:...warehouseIds)', {
                warehouseIds: filters.warehouseIds,
            });
        }

        const lots = await query.getMany();

        const now = new Date();
        const csvData = lots
            .map((lot) => {
                const daysUntilExpiry = Math.ceil(
                    (normalizeExpiryToEndOfDayUTC(new Date(lot.expiry_date)).getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24),
                );

                let riskLevel = 'Low';
                if (daysUntilExpiry < 0) {
                    riskLevel = 'EXPIRED';
                } else if (daysUntilExpiry <= 7) {
                    riskLevel = 'Critical';
                } else if (daysUntilExpiry <= 30) {
                    riskLevel = 'High';
                } else if (daysUntilExpiry <= 60) {
                    riskLevel = 'Medium';
                }

                return {
                    'Product SKU': lot.product?.sku || '',
                    'Product Name': lot.product?.name || '',
                    'Warehouse': lot.warehouse?.name || '',
                    'Lot ID': lot.id.slice(0, 8),
                    'Quantity': lot.quantity,
                    'Unit': lot.product?.unit || '',
                    'Expiry Date': new Date(lot.expiry_date).toLocaleDateString(),
                    'Days Until Expiry': daysUntilExpiry,
                    'Risk Level': riskLevel,
                };
            })
            .filter((item) => item['Risk Level'] !== 'Low'); // Only export items with risk

        return Papa.unparse(csvData);
    }
}
