import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { BarcodeHistory } from './barcode/entities/barcode-history.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockLot } from './stock-lot/entities/stock-lot.entity';
import { BarcodeLookupResult } from './barcode/models/barcode-lookup.model';
import { ProductBarcodeUnit } from './barcode/entities/product-barcode-unit.entity';
import { UpsertProductBarcodeUnitInput } from './barcode/dto/product-barcode-unit.input';
import { CreateCategoryInput, UpdateCategoryInput } from './dto/category.input';
import { CreateProductInput, UpdateProductInput } from './dto/product.input';
import { CreateUnitInput, UpdateUnitInput } from './dto/unit.input';
import {
  CreateStockInput,
  UpdateStockInput,
  AdjustStockInput,
  StockMovementFilterInput,
  CreateOpeningStockInput,
  CompanyInventorySummaryFilterInput,
} from './dto/stock.input';
import { Unit } from './entities/unit.entity';
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
} from './types/company-inventory.types';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WarehouseGuard } from '../auth/guards/warehouse.guard';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Supplier } from '../supplier/supplier.entity';
import { PaginationInput, PageInfo } from '../common/dto/pagination.types';
import { ObjectType, Field } from '@nestjs/graphql';
import { StockLotLoader } from './stock-lot/stock-lot.loader';

@ObjectType()
export class PaginatedProductsResult {
  @Field(() => [Product])
  items: Product[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}

@Resolver(() => Category)
@UseGuards(ClerkAuthGuard)
export class CategoryResolver {
  constructor(private readonly inventoryService: InventoryService) { }

  @Mutation(() => Category)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createCategory(
    @Args('input') input: CreateCategoryInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.createCategory(input, user.activeCompanyId);
  }

  @Query(() => [Category], { name: 'categories' })
  async findAll(@ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findAllCategories(user.activeCompanyId);
  }

  @Mutation(() => Category)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateCategory(
    @Args('input') input: UpdateCategoryInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.updateCategory(input, user.activeCompanyId);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async removeCategory(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.removeCategory(id, user.activeCompanyId);
  }
}

@Resolver(() => Product)
@UseGuards(ClerkAuthGuard)
export class ProductResolver {
  constructor(private readonly inventoryService: InventoryService) { }

  @Mutation(() => Product)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.createProduct(input, user.activeCompanyId);
  }

  @Mutation(() => String)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async generateCompanyBarcode(@ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.generateCompanyBarcode(user.activeCompanyId);
  }

  @Query(() => [Product], { name: 'products' })
  async findAll(@ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findAllProducts(user.activeCompanyId);
  }

  @Query(() => PaginatedProductsResult, { name: 'productsPaginated' })
  async findAllPaginated(
    @Args('pagination', { nullable: true }) pagination: PaginationInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findAllProductsPaginated(
      user.activeCompanyId,
      pagination,
    );
  }

  @Query(() => Product, { name: 'product' })
  async findOne(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findOneProduct(id, user.activeCompanyId);
  }

  @Query(() => Product, { name: 'productByBarcode' })
  async productByBarcode(
    @Args('barcode') barcode: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findProductByBarcode(
      barcode,
      user.activeCompanyId,
    );
  }

  @Query(() => BarcodeLookupResult, { name: 'productByBarcodeDetails' })
  async productByBarcodeDetails(
    @Args('barcode') barcode: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findProductByBarcodeDetails({
      barcode,
      companyId: user.activeCompanyId,
    });
  }

  @Mutation(() => Product)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateProduct(
    @Args('input') input: UpdateProductInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.updateProduct(input, user.activeCompanyId, user.id);
  }

  @Query(() => [BarcodeHistory], { name: 'barcodeHistory' })
  async barcodeHistory(
    @Args('productId') productId: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getBarcodeHistory({
      companyId: user.activeCompanyId,
      productId,
    });
  }

  @Query(() => [ProductBarcodeUnit], { name: 'productBarcodeUnits' })
  async productBarcodeUnits(
    @Args('productId') productId: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getProductBarcodeUnits({
      companyId: user.activeCompanyId,
      productId,
    });
  }

  @Mutation(() => ProductBarcodeUnit)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async upsertProductBarcodeUnit(
    @Args('input') input: UpsertProductBarcodeUnitInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.upsertProductBarcodeUnit({
      companyId: user.activeCompanyId,
      input,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async removeProductBarcodeUnit(
    @Args('id') id: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.removeProductBarcodeUnit({
      companyId: user.activeCompanyId,
      id,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async removeProduct(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.removeProduct(id, user.activeCompanyId);
  }

  // async supplier(@Parent() product: Product) { ... }
}

@Resolver(() => Unit)
@UseGuards(ClerkAuthGuard)
export class UnitResolver {
  constructor(private readonly inventoryService: InventoryService) { }

  @Mutation(() => Unit)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createUnit(
    @Args('input') input: CreateUnitInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.createUnit(input, user.activeCompanyId);
  }

  @Query(() => [Unit], { name: 'units' })
  async findAll(
    @ClerkUser() user: any,
    @Args('includeArchived', { type: () => Boolean, nullable: true }) includeArchived?: boolean,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.findAllUnits(user.activeCompanyId, includeArchived ?? false);
  }

  @Mutation(() => Unit)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateUnit(
    @Args('input') input: UpdateUnitInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.updateUnit(input, user.activeCompanyId);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async removeUnit(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.removeUnit(id, user.activeCompanyId);
  }
}

@Resolver(() => Stock)
@UseGuards(ClerkAuthGuard, RolesGuard)
export class StockResolver {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly stockLotLoader: StockLotLoader,
  ) { }

  @ResolveField(() => [StockLot], { name: 'lots', nullable: true })
  async resolveLots(@Parent() stock: Stock) {
    return this.stockLotLoader.getLotsForStock({
      company_id: stock.company_id,
      product_id: stock.product_id,
      warehouse_id: stock.warehouse_id,
    });
  }

  /**
   * Phase 1: Create opening stock for a product in a warehouse
   * Only OWNER, ADMIN, and MANAGER roles can create opening stock
   */
  @Mutation(() => Stock)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createOpeningStock(
    @Args('input') input: CreateOpeningStockInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.createOpeningStock(
      input,
      user.activeCompanyId,
      user.userId,
      user.role,
    );
  }

  @Mutation(() => Stock)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createStock(
    @Args('input') input: CreateStockInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.createStock(
      input,
      user.activeCompanyId,
      user.userId,
    );
  }

  @Query(() => Stock, { name: 'stock' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getStock(
    @Args('productId') productId: string,
    @Args('warehouseId') warehouseId: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getStock(
      productId,
      warehouseId,
      user.activeCompanyId,
    );
  }

  @Query(() => [Stock], { name: 'stockByWarehouse' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getStockByWarehouse(
    @Args('warehouseId') warehouseId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getStockByWarehouse(
      warehouseId,
      user.activeCompanyId,
      limit,
      offset,
    );
  }

  @Query(() => [Stock], { name: 'stockByProduct' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getStockByProduct(
    @Args('productId') productId: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getStockByProduct(
      productId,
      user.activeCompanyId,
    );
  }

  @Query(() => [Stock], { name: 'allStock' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getAllStock(
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getAllStock(
      user.activeCompanyId,
      limit,
      offset,
    );
  }

  @Mutation(() => Stock)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateStockLevels(
    @Args('input') input: UpdateStockInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.updateStockLevels(input, user.activeCompanyId);
  }

  /**
   * Phase 1: Adjust stock quantities (increase or decrease)
   * Only OWNER, ADMIN, and MANAGER roles can adjust stock
   */
  @Mutation(() => Stock)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async adjustStock(
    @Args('input') input: AdjustStockInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.adjustStock(
      input,
      user.activeCompanyId,
      user.userId,
      user.role,
    );
  }

  @Query(() => [StockMovement], { name: 'companyStockMovements' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getCompanyStockMovements(
    @Args('filters') filters: StockMovementFilterInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getStockMovements(
      filters,
      user.activeCompanyId,
    );
  }

  @Query(() => [CompanyInventorySummaryItem], {
    name: 'companyInventorySummary',
  })
  @Roles(Role.OWNER, Role.ADMIN)
  async getCompanyInventorySummary(
    @Args('filters') filters: CompanyInventorySummaryFilterInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getCompanyInventorySummary(
      filters,
      user.activeCompanyId,
    );
  }

  // ===========================
  // VISUALIZATION QUERIES
  // ===========================

  @Query(() => InventoryHealthStats, { name: 'inventoryHealthStats' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getInventoryHealthStats(@ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getInventoryHealthStats(user.activeCompanyId);
  }

  @Query(() => [TopStockProduct], { name: 'topStockProducts' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getTopStockProducts(
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 })
    limit: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getTopStockProducts(
      user.activeCompanyId,
      limit,
    );
  }

  @Query(() => [CriticalStockProduct], { name: 'criticalStockProducts' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getCriticalStockProducts(
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 })
    limit: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getCriticalStockProducts(
      user.activeCompanyId,
      limit,
    );
  }

  @Query(() => [WarehouseStockDistribution], {
    name: 'warehouseStockDistribution',
  })
  @Roles(Role.OWNER, Role.ADMIN)
  async getWarehouseStockDistribution(
    @Args('productId') productId: string,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getWarehouseStockDistribution(
      productId,
      user.activeCompanyId,
    );
  }

  @Query(() => [WarehouseHealthScore], { name: 'warehouseHealthScorecard' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getWarehouseHealthScorecard(@ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getWarehouseHealthScorecard(
      user.activeCompanyId,
    );
  }

  @Query(() => [MovementTrendData], { name: 'movementTrends' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getMovementTrends(
    @Args('days', { type: () => Number, nullable: true, defaultValue: 30 })
    days: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getMovementTrends(user.activeCompanyId, days);
  }

  @Query(() => [MovementTypeBreakdown], { name: 'movementTypeBreakdown' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getMovementTypeBreakdown(
    @Args('days', { type: () => Number, nullable: true, defaultValue: 30 })
    days: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getMovementTypeBreakdown(
      user.activeCompanyId,
      days,
    );
  }

  @Query(() => [AdjustmentTrendData], { name: 'adjustmentTrends' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getAdjustmentTrends(
    @Args('days', { type: () => Number, nullable: true, defaultValue: 30 })
    days: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getAdjustmentTrends(
      user.activeCompanyId,
      days,
    );
  }

  @Query(() => [AdjustmentByWarehouse], { name: 'adjustmentsByWarehouse' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getAdjustmentsByWarehouse(
    @Args('days', { type: () => Number, nullable: true, defaultValue: 30 })
    days: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getAdjustmentsByWarehouse(
      user.activeCompanyId,
      days,
    );
  }

  @Query(() => [AdjustmentByUser], { name: 'adjustmentsByUser' })
  @Roles(Role.OWNER, Role.ADMIN)
  async getAdjustmentsByUser(
    @Args('days', { type: () => Number, nullable: true, defaultValue: 30 })
    days: number,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 })
    limit: number,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getAdjustmentsByUser(
      user.activeCompanyId,
      days,
      limit,
    );
  }

  @Query(() => CompanyStockHealthOverview, {
    name: 'companyStockHealthOverview',
  })
  @Roles(Role.OWNER, Role.ADMIN)
  async getCompanyStockHealthOverview(@ClerkUser() user: any) {
    if (!user.activeCompanyId)
      throw new BadRequestException('Active company required');
    return this.inventoryService.getCompanyStockHealthOverview(
      user.activeCompanyId,
    );
  }
}
