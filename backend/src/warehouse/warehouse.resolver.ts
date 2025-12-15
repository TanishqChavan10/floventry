import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { Warehouse } from './warehouse.entity';
import { WarehouseSettings as WarehouseSettingsModel } from './warehouse-settings.model';
import { CreateWarehouseInput } from './dto/create-warehouse.input';
import { UpdateWarehouseInput, UpdateWarehouseSettingsInput } from './dto/update-warehouse.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => Warehouse)
export class WarehouseResolver {
    constructor(private readonly warehouseService: WarehouseService) { }

    @Mutation(() => Warehouse)
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async createWarehouse(
        @Args('input') input: CreateWarehouseInput,
        @ClerkUser() user: any,
    ): Promise<Warehouse> {
        if (!user.activeCompanyId) {
            throw new Error('No active company');
        }

        return this.warehouseService.create(input, user.activeCompanyId, user.id);
    }

    @Mutation(() => Warehouse)
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async updateWarehouse(
        @Args('id') id: string,
        @Args('input') input: UpdateWarehouseInput,
    ): Promise<Warehouse> {
        return this.warehouseService.update(id, input);
    }

    @Mutation(() => WarehouseSettingsModel)
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async updateWarehouseSettings(
        @Args('warehouseId') warehouseId: string,
        @Args('input') input: UpdateWarehouseSettingsInput,
    ): Promise<WarehouseSettingsModel> {
        return this.warehouseService.updateSettings(warehouseId, input);
    }

    @Query(() => Warehouse)
    @UseGuards(ClerkAuthGuard)
    async warehouse(@Args('id') id: string): Promise<Warehouse> {
        return this.warehouseService.findOne(id);
    }

    @Query(() => [Warehouse])
    @UseGuards(ClerkAuthGuard)
    async warehouses(@ClerkUser() user: any): Promise<Warehouse[]> {
        if (!user.activeCompanyId) {
            return [];
        }
        return this.warehouseService.findAll(user.activeCompanyId);
    }
}
