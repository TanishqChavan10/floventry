import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { CreateInventoryAdjustmentInput } from './dto/adjustment.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WarehouseGuard } from '../auth/guards/warehouse.guard';
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
   * RBAC: OWNER, ADMIN, MANAGER (assigned warehouses only via WarehouseGuard)
   */
  @Mutation(() => InventoryAdjustmentResult)
  @UseGuards(WarehouseGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createInventoryAdjustment(
    @Args('input') input: CreateInventoryAdjustmentInput,
    @ClerkUser() user: any,
  ): Promise<InventoryAdjustmentResult> {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.inventoryService.createInventoryAdjustment(
      input,
      user.activeCompanyId,
      user.userId,
      user.role,
    );
  }
}
