import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { GoodsReceiptNote } from './entities/goods-receipt-note.entity';
import { GRNService } from './grn.service';
import {
  CreateGRNInput,
  UpdateGRNInput,
  GRNFilterInput,
} from './dto/grn.input';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { WarehouseGuard } from '../../auth/guards/warehouse.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => GoodsReceiptNote)
@UseGuards(AuthGuard, RolesGuard, WarehouseGuard)
export class GRNResolver {
  constructor(private grnService: GRNService) {}

  // Staff can view GRNs in their assigned warehouse
  @Query(() => [GoodsReceiptNote], { name: 'grns' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getGRNs(
    @Args('filters') filters: GRNFilterInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.grnService.getGRNs(filters, user.activeCompanyId);
  }

  @Query(() => GoodsReceiptNote, { name: 'grn', nullable: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getGRN(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.grnService.getGRN(id, user.activeCompanyId);
  }

  // Staff can create and edit draft GRNs
  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async createGRN(
    @Args('input') input: CreateGRNInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.grnService.createGRN(
      input,
      user.activeCompanyId,
      user.userId,
      user.role,
    );
  }

  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateGRN(
    @Args('id') id: string,
    @Args('input') input: UpdateGRNInput,
    @CurrentUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.grnService.updateGRN(id, input, user.activeCompanyId);
  }

  // Post and cancel: MANAGER+ only
  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async postGRN(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.grnService.postGRN(id, user.activeCompanyId, user.userId);
  }

  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER)
  async cancelGRN(@Args('id') id: string, @CurrentUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }
    return this.grnService.cancelGRN(id, user.activeCompanyId);
  }
}
