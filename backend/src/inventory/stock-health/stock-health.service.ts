import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { StockLot } from '../stock-lot/entities/stock-lot.entity';
import { Product } from '../entities/product.entity';
import {
  WarehouseStockHealthResult,
  CompanyStockHealthResult,
  StockHealthState,
} from './stock-health.types';
import {
  calculateUsableStock,
  determineStockHealthState,
  generateRecommendation,
  groupLotsByProduct,
  stateIsSevereThan,
} from './stock-health.utils';
import {
  isExpiryInPastEndOfDay,
  normalizeExpiryToEndOfDayUTC,
  endOfDayUtcFromNowPlusDays,
} from '../../common/utils/expiry-date';

@Injectable()
export class StockHealthService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockLot)
    private stockLotRepository: Repository<StockLot>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  private readonly excludeExpiringSoon =
    process.env.REORDER_EXCLUDE_EXPIRING_SOON === 'true';
  private readonly expiryWarningDays = parseInt(
    process.env.EXPIRY_WARNING_DAYS || '30',
    10,
  );

  /**
   * Get stock health for a specific warehouse
   *
   * ✅ CORRECTED: Batch-load lots to eliminate N+1 queries
   */
  async getWarehouseStockHealth(
    warehouseId: string,
  ): Promise<WarehouseStockHealthResult[]> {
    // Get all stock for this warehouse
    const stocks = await this.stockRepository.find({
      where: { warehouse_id: warehouseId },
      relations: ['product'],
    });

    if (stocks.length === 0) {
      return [];
    }

    // ✅ FIX: Batch-load ALL lots for this warehouse in one query
    const allLots = await this.stockLotRepository.find({
      where: { warehouse_id: warehouseId },
    });

    // Group lots by product ID for O(1) lookup
    const lotsByProduct = groupLotsByProduct(allLots);

    const results: WarehouseStockHealthResult[] = [];

    for (const stock of stocks) {
      const productLots = lotsByProduct.get(stock.product_id) || [];
      const healthResult = this.calculateProductHealth(stock, productLots);
      results.push(healthResult);
    }

    return results;
  }

  /**
   * Get company-wide stock health
   *
   * ✅ CORRECTED: Batch-load lots for entire company
   */
  async getCompanyStockHealth(
    companyId: string,
  ): Promise<CompanyStockHealthResult[]> {
    // Get all products for company
    const products = await this.productRepository.find({
      where: { company_id: companyId },
    });

    if (products.length === 0) {
      return [];
    }

    // ✅ FIX: Batch-load all lots for this company
    const allLots = await this.stockLotRepository.find({
      where: { company_id: companyId },
    });

    const lotsByProduct = groupLotsByProduct(allLots);

    // Get all stocks for company
    const stocks = await this.stockRepository.find({
      where: { company_id: companyId },
      relations: ['product'],
    });

    // Group stocks by product
    const stocksByProduct = new Map<string, Stock[]>();
    for (const stock of stocks) {
      const existing = stocksByProduct.get(stock.product_id) || [];
      existing.push(stock);
      stocksByProduct.set(stock.product_id, existing);
    }

    const results: CompanyStockHealthResult[] = [];

    for (const product of products) {
      const productStocks = stocksByProduct.get(product.id) || [];
      const productLots = lotsByProduct.get(product.id) || [];

      if (productStocks.length === 0) continue;

      const companyHealth = this.calculateCompanyProductHealth(
        product,
        productStocks,
        productLots,
      );
      results.push(companyHealth);
    }

    return results;
  }

  /**
   * Calculate health for a specific product at a warehouse
   *
   * ✅ CORRECTED: Takes pre-loaded lots, no queries
   * ✅ CORRECTED: Uses totalStock in state determination
   */
  private calculateProductHealth(
    stock: Stock,
    lots: StockLot[],
  ): WarehouseStockHealthResult {
    const now = new Date();
    const warningCutoff = endOfDayUtcFromNowPlusDays(
      this.expiryWarningDays,
      now,
    );

    // Calculate quantities by expiry status
    let expiredQty = 0;
    let expiringSoonQty = 0;
    let nearestExpiry: Date | null = null;

    for (const lot of lots) {
      const qty =
        lot.quantity === null || lot.quantity === undefined
          ? 0
          : parseFloat(lot.quantity.toString());

      if (!lot.expiry_date || qty <= 0) continue;

      // ✅ Use normalized expiry utilities for consistency
      if (isExpiryInPastEndOfDay(lot.expiry_date, now)) {
        expiredQty += qty;
      } else if (
        normalizeExpiryToEndOfDayUTC(lot.expiry_date) <= warningCutoff
      ) {
        expiringSoonQty += qty;
        if (!nearestExpiry || lot.expiry_date < nearestExpiry) {
          nearestExpiry = lot.expiry_date;
        }
      } else {
        // Future expiry - track nearest
        if (!nearestExpiry || lot.expiry_date < nearestExpiry) {
          nearestExpiry = lot.expiry_date;
        }
      }
    }

    const totalStock =
      stock.quantity === null || stock.quantity === undefined
        ? 0
        : parseFloat(stock.quantity.toString());
    const usableStock = calculateUsableStock(
      totalStock,
      expiredQty,
      expiringSoonQty,
      this.excludeExpiringSoon,
    );

    // ✅ CORRECTED: Pass totalStock to state determination
    const state = determineStockHealthState(
      usableStock,
      totalStock,
      expiredQty,
      expiringSoonQty,
      stock.reorder_point
        ? parseFloat(stock.reorder_point.toString())
        : undefined,
    );

    const recommendation = generateRecommendation(
      state,
      usableStock,
      expiringSoonQty,
      nearestExpiry || undefined,
    );

    return {
      productId: stock.product_id,
      productName: stock.product.name,
      warehouseId: stock.warehouse_id,
      totalStock,
      usableStock,
      expiredQty,
      expiringSoonQty,
      state,
      nearestExpiryDate: nearestExpiry || undefined,
      reorderPoint: stock.reorder_point
        ? parseFloat(stock.reorder_point.toString())
        : undefined,
      recommendation,
    };
  }

  /**
   * Aggregate health across all warehouses for a product
   *
   * ✅ CORRECTED: Only include non-healthy warehouses in affectedWarehouses
   * ✅ CORRECTED: Lots already pre-loaded
   */
  private calculateCompanyProductHealth(
    product: Product,
    stocks: Stock[],
    lots: StockLot[],
  ): CompanyStockHealthResult {
    let totalUsableStock = 0;
    let worstState = StockHealthState.HEALTHY;
    const affectedWarehouses: string[] = []; // ✅ Only non-healthy warehouses
    let nearestExpiry: Date | null = null;

    // Group lots by warehouse for this product
    const lotsByWarehouse = new Map<string, StockLot[]>();
    for (const lot of lots) {
      const existing = lotsByWarehouse.get(lot.warehouse_id) || [];
      existing.push(lot);
      lotsByWarehouse.set(lot.warehouse_id, existing);
    }

    for (const stock of stocks) {
      const warehouseLots = lotsByWarehouse.get(stock.warehouse_id) || [];
      const health = this.calculateProductHealth(stock, warehouseLots);

      totalUsableStock += health.usableStock;

      // ✅ CORRECTED: Only add warehouse to "affected" if NOT healthy
      if (health.state !== StockHealthState.HEALTHY) {
        affectedWarehouses.push(stock.warehouse_id);
      }

      // Track worst state
      if (stateIsSevereThan(health.state, worstState)) {
        worstState = health.state;
      }

      // Track nearest expiry
      if (health.nearestExpiryDate) {
        if (!nearestExpiry || health.nearestExpiryDate < nearestExpiry) {
          nearestExpiry = health.nearestExpiryDate;
        }
      }
    }

    // TODO: Company-specific recommendations for better context
    // e.g., "3 warehouses blocked due to expired stock"
    const recommendation = generateRecommendation(
      worstState,
      totalUsableStock,
      0, // Aggregated, so we don't track expiring soon at company level
      nearestExpiry || undefined,
    );

    return {
      productId: product.id,
      productName: product.name,
      totalUsableStock,
      state: worstState,
      affectedWarehouses, // ✅ Now only non-healthy warehouses
      nearestExpiryDate: nearestExpiry || undefined,
      recommendation,
    };
  }
}
