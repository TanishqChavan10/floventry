import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { GoodsReceiptNote } from './entities/goods-receipt-note.entity';
import { GRNService } from './grn.service';
import {
  CreateGRNInput,
  UpdateGRNInput,
  GRNFilterInput,
} from './dto/grn.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => GoodsReceiptNote)
@UseGuards(ClerkAuthGuard, RolesGuard)
export class GRNResolver {
  constructor(private grnService: GRNService) {}

  @Query(() => [GoodsReceiptNote], { name: 'grns' })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async getGRNs(
    @Args('filters') filters: GRNFilterInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.grnService.getGRNs(filters, user.activeCompanyId);
  }

  @Query(() => GoodsReceiptNote, { name: 'grn', nullable: true })
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async getGRN(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.grnService.getGRN(id, user.activeCompanyId);
  }

  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createGRN(
    @Args('input') input: CreateGRNInput,
    @ClerkUser() user: any,
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
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateGRN(
    @Args('id') id: string,
    @Args('input') input: UpdateGRNInput,
    @ClerkUser() user: any,
  ) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.grnService.updateGRN(id, input, user.activeCompanyId);
  }

  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async postGRN(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.grnService.postGRN(id, user.activeCompanyId, user.userId);
  }

  @Mutation(() => GoodsReceiptNote)
  @Roles(Role.OWNER, Role.ADMIN)
  async cancelGRN(@Args('id') id: string, @ClerkUser() user: any) {
    if (!user.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.grnService.cancelGRN(id, user.activeCompanyId);
  }
}
