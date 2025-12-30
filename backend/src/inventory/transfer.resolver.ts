import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { WarehouseTransfer } from './entities/warehouse-transfer.entity';
import { TransferService } from './transfer.service';
import {
    CreateTransferInput,
    UpdateTransferInput,
    TransferFilterInput,
} from './dto/transfer.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => WarehouseTransfer)
@UseGuards(ClerkAuthGuard, RolesGuard)
export class TransferResolver {
    constructor(private transferService: TransferService) { }

    @Query(() => [WarehouseTransfer], { name: 'warehouseTransfers' })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getTransfers(
        @Args('filters') filters: TransferFilterInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        return this.transferService.getTransfers(filters, user.activeCompanyId);
    }

    @Query(() => WarehouseTransfer, { name: 'warehouseTransfer', nullable: true })
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
    async getTransfer(
        @Args('id') id: string,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        return this.transferService.getTransfer(id, user.activeCompanyId);
    }

    @Mutation(() => WarehouseTransfer)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async createWarehouseTransfer(
        @Args('input') input: CreateTransferInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        console.log('[CREATE TRANSFER] User object:', {
            userId: user.userId,
            activeCompanyId: user.activeCompanyId,
            role: user.role,
        });

        // TODO: For MANAGER role, validate they manage the source warehouse
        return this.transferService.createTransfer(
            input,
            user.activeCompanyId,
            user.userId,
            user.role,
        );
    }

    @Mutation(() => WarehouseTransfer)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async updateWarehouseTransfer(
        @Args('id') id: string,
        @Args('input') input: UpdateTransferInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        return this.transferService.updateTransfer(id, input, user.activeCompanyId);
    }

    @Mutation(() => WarehouseTransfer)
    @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
    async postWarehouseTransfer(
        @Args('id') id: string,
        @ClerkUser() user: any,
    ) {
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

    @Mutation(() => WarehouseTransfer)
    @Roles(Role.OWNER, Role.ADMIN)
    async cancelWarehouseTransfer(
        @Args('id') id: string,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Active company required');
        }

        return this.transferService.cancelTransfer(id, user.activeCompanyId);
    }
}
