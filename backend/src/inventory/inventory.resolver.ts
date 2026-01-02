import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateCategoryInput, UpdateCategoryInput } from './dto/category.input';
import { CreateProductInput, UpdateProductInput } from './dto/product.input';
import { CreateUnitInput, UpdateUnitInput } from './dto/unit.input';
import { CreateStockInput, UpdateStockInput, AdjustStockInput, StockMovementFilterInput, CreateOpeningStockInput } from './dto/stock.input';
import { Unit } from './entities/unit.entity';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Supplier } from '../supplier/supplier.entity';

@Resolver(() => Category)
@UseGuards(ClerkAuthGuard)
export class CategoryResolver {
    constructor(private readonly inventoryService: InventoryService) { }

    @Mutation(() => Category)
    async createCategory(
        @Args('input') input: CreateCategoryInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.createCategory(input, user.activeCompanyId);
    }

    @Query(() => [Category], { name: 'categories' })
    async findAll(@ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.findAllCategories(user.activeCompanyId);
    }

    @Mutation(() => Category)
    async updateCategory(
        @Args('input') input: UpdateCategoryInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.updateCategory(input, user.activeCompanyId);
    }

    @Mutation(() => Boolean)
    async removeCategory(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.removeCategory(id, user.activeCompanyId);
    }
}

@Resolver(() => Product)
@UseGuards(ClerkAuthGuard)
export class ProductResolver {
    constructor(private readonly inventoryService: InventoryService) { }

    @Mutation(() => Product)
    async createProduct(
        @Args('input') input: CreateProductInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.createProduct(input, user.activeCompanyId);
    }

    @Query(() => [Product], { name: 'products' })
    async findAll(@ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.findAllProducts(user.activeCompanyId);
    }

    @Query(() => Product, { name: 'product' })
    async findOne(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.findOneProduct(id, user.activeCompanyId);
    }

    @Mutation(() => Product)
    async updateProduct(
        @Args('input') input: UpdateProductInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.updateProduct(input, user.activeCompanyId);
    }

    @Mutation(() => Boolean)
    async removeProduct(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.removeProduct(id, user.activeCompanyId);
    }

    // async supplier(@Parent() product: Product) { ... }
}

@Resolver(() => Unit)
@UseGuards(ClerkAuthGuard)
export class UnitResolver {
    constructor(private readonly inventoryService: InventoryService) { }

    @Mutation(() => Unit)
    async createUnit(
        @Args('input') input: CreateUnitInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.createUnit(input, user.activeCompanyId);
    }

    @Query(() => [Unit], { name: 'units' })
    async findAll(@ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.findAllUnits(user.activeCompanyId);
    }

    @Mutation(() => Unit)
    async updateUnit(
        @Args('input') input: UpdateUnitInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.updateUnit(input, user.activeCompanyId);
    }

    @Mutation(() => Boolean)
    async removeUnit(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.removeUnit(id, user.activeCompanyId);
    }
}

@Resolver(() => Stock)
@UseGuards(ClerkAuthGuard, RolesGuard)
export class StockResolver {
    constructor(private readonly inventoryService: InventoryService) { }

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
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.createOpeningStock(input, user.activeCompanyId, user.userId, user.role);
    }

    @Mutation(() => Stock)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async createStock(
        @Args('input') input: CreateStockInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.createStock(input, user.activeCompanyId, user.userId);
    }

    @Query(() => Stock, { name: 'stock' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getStock(
        @Args('productId') productId: string,
        @Args('warehouseId') warehouseId: string,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.getStock(productId, warehouseId, user.activeCompanyId);
    }

    @Query(() => [Stock], { name: 'stockByWarehouse' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getStockByWarehouse(
        @Args('warehouseId') warehouseId: string,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.getStockByWarehouse(warehouseId, user.activeCompanyId);
    }

    @Query(() => [Stock], { name: 'stockByProduct' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getStockByProduct(
        @Args('productId') productId: string,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.getStockByProduct(productId, user.activeCompanyId);
    }

    @Query(() => [Stock], { name: 'allStock' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getAllStock(@ClerkUser() user: any) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.getAllStock(user.activeCompanyId);
    }

    @Mutation(() => Stock)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async updateStockLevels(
        @Args('input') input: UpdateStockInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
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
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.adjustStock(input, user.activeCompanyId, user.userId, user.role);
    }

    @Query(() => [StockMovement], { name: 'stockMovements' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getStockMovements(
        @Args('filters') filters: StockMovementFilterInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) throw new BadRequestException('Active company required');
        return this.inventoryService.getStockMovements(filters, user.activeCompanyId);
    }
}

