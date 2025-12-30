import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { Stock } from './entities/stock.entity';
import { StockHealthItem } from './types/stock-health.types';
import { UpdateStockThresholdsInput } from './dto/stock-health.input';
import { InventoryService } from './inventory.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class LowStockResolver {
    constructor(private inventoryService: InventoryService) { }

    /**
     * Get low stock items for a warehouse
     * Returns only WARNING & CRITICAL items
     */
    @Query(() => [StockHealthItem], { name: 'lowStockItems' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getLowStockItems(
        @Args('warehouseId') warehouseId: string,
        @ClerkUser() user: any,
    ): Promise<StockHealthItem[]> {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        // TODO: For MANAGER role, validate they manage the warehouse
        return this.inventoryService.getLowStockItems(
            warehouseId,
            user.activeCompanyId,
            user.role,
            user.userId,
        );
    }

    /**
     * Update stock thresholds
     * RBAC: Restrict to OWNER, ADMIN, MANAGER
     */
    @Mutation(() => Stock)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async updateStockThresholds(
        @Args('stockId') stockId: string,
        @Args('input') input: UpdateStockThresholdsInput,
        @ClerkUser() user: any,
    ): Promise<Stock> {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        // TODO: For MANAGER role, validate warehouse ownership
        return this.inventoryService.updateStockThresholds(
            stockId,
            input,
            user.activeCompanyId,
            user.userId,
            user.role,
        );
    }
}
