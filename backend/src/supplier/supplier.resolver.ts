import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from './supplier.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => Supplier)
@UseGuards(ClerkAuthGuard)
export class SupplierResolver {
    constructor(private readonly supplierService: SupplierService) { }

    @Mutation(() => Supplier)
    async createSupplier(
        @Args('input') createSupplierInput: CreateSupplierInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.create(createSupplierInput, user.activeCompanyId);
    }

    @Query(() => [Supplier], { name: 'suppliers' })
    async findAll(@ClerkUser() user: any) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.findAll(user.activeCompanyId);
    }

    @Query(() => Supplier, { name: 'supplier' })
    async findOne(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.findOne(id, user.activeCompanyId);
    }

    @Mutation(() => Supplier)
    async updateSupplier(
        @Args('input') updateSupplierInput: UpdateSupplierInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.update(updateSupplierInput, user.activeCompanyId);
    }

    @Mutation(() => Boolean)
    async removeSupplier(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.remove(id, user.activeCompanyId);
    }
}
