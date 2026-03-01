import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { TransferService } from './transfer.service';
import {
  CreateTransferInput,
  UpdateTransferInput,
  TransferFilterInput,
} from './dto/transfer.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { WarehouseGuard } from '../../auth/guards/warehouse.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => WarehouseTransfer)
@UseGuards(AuthGuard, RolesGuard, WarehouseGuard)
export class TransferResolver {
  constructor(private transferService: TransferService) { }

  // Staff can view transfers for their assigned warehouse
  @Query(() => [WarehouseTransfer], { name: 'warehouseTransfers' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getTransfers(
    @Args('filters') filters: TransferFilterInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.transferService.getTransfers(filters, user.activeCompanyId);
  }

  @Query(() => WarehouseTransfer, { name: 'warehouseTransfer', nullable: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getTransfer(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.transferService.getTransfer(id, user.activeCompanyId);
  }

  // Staff can create and edit draft transfers
  @Mutation(() => WarehouseTransfer)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async createWarehouseTransfer(
    @Args('input') input: CreateTransferInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.transferService.createTransfer(
      input,
      user.activeCompanyId,
      user.userId,
      user.role,
    );
  }

  @Mutation(() => WarehouseTransfer)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateWarehouseTransfer(
    @Args('id') id: string,
    @Args('input') input: UpdateTransferInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.transferService.updateTransfer(id, input, user.activeCompanyId);
  }

  // Post: MANAGER+ only
  @Mutation(() => WarehouseTransfer)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async postWarehouseTransfer(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.transferService.postTransfer(
      id,
      user.activeCompanyId,
      user.userId,
      user.role,
    );
  }

  // Cancel posted transfer: OWNER only
  @Mutation(() => WarehouseTransfer)
  @Roles(Role.OWNER)
  async cancelWarehouseTransfer(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.transferService.cancelTransfer(id, user.activeCompanyId);
  }
}
