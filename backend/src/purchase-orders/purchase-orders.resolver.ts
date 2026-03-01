import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderFilterInput,
} from './dto/purchase-order.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => PurchaseOrder)
@UseGuards(AuthGuard, RolesGuard)
export class PurchaseOrdersResolver {
  constructor(private purchaseOrdersService: PurchaseOrdersService) {}

  @Query(() => [PurchaseOrder], { name: 'purchaseOrders' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getPurchaseOrders(
    @Args('filters') filters: PurchaseOrderFilterInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.purchaseOrdersService.getPurchaseOrders(
      filters,
      user.activeCompanyId,
    );
  }

  @Query(() => PurchaseOrder, { name: 'purchaseOrder', nullable: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getPurchaseOrder(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.purchaseOrdersService.getPurchaseOrder(
      id,
      user.activeCompanyId,
    );
  }

  @Mutation(() => PurchaseOrder)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createPurchaseOrder(
    @Args('input') input: CreatePurchaseOrderInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.purchaseOrdersService.createPurchaseOrder(
      input,
      user.activeCompanyId,
      user.userId,
      user.role, // Pass the user's role for validation
    );
  }

  @Mutation(() => PurchaseOrder)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updatePurchaseOrder(
    @Args('id') id: string,
    @Args('input') input: UpdatePurchaseOrderInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.purchaseOrdersService.updatePurchaseOrder(
      id,
      input,
      user.activeCompanyId,
    );
  }

  @Mutation(() => PurchaseOrder)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async markPurchaseOrderOrdered(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.purchaseOrdersService.markPurchaseOrderOrdered(
      id,
      user.activeCompanyId,
    );
  }

  @Mutation(() => PurchaseOrder)
  @Roles(Role.OWNER, Role.ADMIN)
  async cancelPurchaseOrder(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.purchaseOrdersService.cancelPurchaseOrder(
      id,
      user.activeCompanyId,
    );
  }
}
