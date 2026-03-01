import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesOrder } from './entities/sales-order.entity';
import {
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from './dto/sales-order.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => SalesOrder)
export class SalesResolver {
  constructor(private readonly salesService: SalesService) { }

  @Query(() => [SalesOrder])
  @UseGuards(AuthGuard)
  async salesOrders(
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset: number,
    @CurrentUser() user: any,
  ): Promise<SalesOrder[]> {
    if (!user.activeCompanyId) {
      return [];
    }
    return this.salesService.findAll(user.activeCompanyId, limit, offset);
  }

  @Query(() => SalesOrder)
  @UseGuards(AuthGuard)
  async salesOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SalesOrder> {
    return this.salesService.findOne(id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createSalesOrder(
    @Args('input') input: CreateSalesOrderInput,
    @CurrentUser() user: any,
  ): Promise<SalesOrder> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }
    return this.salesService.create(input, user.activeCompanyId, user.id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateSalesOrder(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSalesOrderInput,
    @CurrentUser() user: any,
  ): Promise<SalesOrder> {
    return this.salesService.update(id, input, user.id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async confirmSalesOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SalesOrder> {
    return this.salesService.confirm(id);
  }

  @Mutation(() => SalesOrder)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async cancelSalesOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SalesOrder> {
    return this.salesService.cancel(id);
  }
}
