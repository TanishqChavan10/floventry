import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateInventoryAdjustmentInput } from './dto/adjustment.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@ObjectType()
class InventoryAdjustmentResult {
    @Field()
    success: boolean;

    @Field(() => StockMovement)
    stockMovement: StockMovement;

    @Field(() => Stock)
    stock: Stock;
}

@Resolver()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AdjustmentResolver {
    constructor(private readonly inventoryService: InventoryService) { }

    /**
     * Create inventory adjustment for stock correction
     * RBAC: OWNER, ADMIN, MANAGER only
     * Managers can only adjust stock in their assigned warehouses
     */
    @Mutation(() => InventoryAdjustmentResult)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async createInventoryAdjustment(
        @Args('input') input: CreateInventoryAdjustmentInput,
        @ClerkUser() user: any,
    ): Promise<InventoryAdjustmentResult> {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        // TODO: For MANAGER role, validate warehouse assignment
        // if (user.role === Role.MANAGER) {
        //     const assignedWarehouses = user.warehouses?.map(w => w.warehouseId) || [];
        //     if (!assignedWarehouses.includes(input.warehouse_id)) {
        //         throw new ForbiddenException('You can only adjust stock in your assigned warehouses');
        //     }
        // }

        return this.inventoryService.createInventoryAdjustment(
            input,
            user.activeCompanyId,
            user.userId,
            user.role,
        );
    }
}
