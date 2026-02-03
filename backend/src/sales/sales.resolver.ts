import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesOrder } from './entities/sales-order.entity';
import {
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from './dto/sales-order.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => SalesOrder)
export class SalesResolver {
  constructor(private readonly salesService: SalesService) {}

  @Query(() => [SalesOrder])
  @UseGuards(ClerkAuthGuard)
  async salesOrders(@ClerkUser() user: any): Promise<SalesOrder[]> {
    if (!user.activeCompanyId) {
      return [];
    }
    return this.salesService.findAll(user.activeCompanyId);
  }

  @Query(() => SalesOrder)
  @UseGuards(ClerkAuthGuard)
  async salesOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SalesOrder> {
    return this.salesService.findOne(id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createSalesOrder(
    @Args('input') input: CreateSalesOrderInput,
    @ClerkUser() user: any,
  ): Promise<SalesOrder> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }
    return this.salesService.create(input, user.activeCompanyId, user.id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSalesOrderInput,
    @ClerkUser() user: any,
  ): Promise<SalesOrder> {
    return this.salesService.update(id, input, user.id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async confirmSalesOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SalesOrder> {
    return this.salesService.confirm(id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async cancelSalesOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SalesOrder> {
    return this.salesService.cancel(id);
  }
}
