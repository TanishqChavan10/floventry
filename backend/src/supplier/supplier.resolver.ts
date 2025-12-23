import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from './supplier.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => Supplier)
@UseGuards(ClerkAuthGuard)
export class SupplierResolver {
    constructor(private readonly supplierService: SupplierService) { }

    @Mutation(() => Supplier)
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
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
    async findAll(
        @ClerkUser() user: any,
        @Args('includeArchived', { type: () => Boolean, nullable: true, defaultValue: false }) includeArchived?: boolean,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.findAll(user.activeCompanyId, includeArchived);
    }

    @Query(() => Supplier, { name: 'supplier' })
    async findOne(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.findOne(id, user.activeCompanyId);
    }

    @Mutation(() => Supplier)
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async updateSupplier(
        @Args('input') updateSupplierInput: UpdateSupplierInput,
        @ClerkUser() user: any,
    ) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.update(updateSupplierInput, user.activeCompanyId);
    }

    @Mutation(() => Supplier)
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async archiveSupplier(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.archive(id, user.activeCompanyId);
    }

    @Mutation(() => Supplier)
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async unarchiveSupplier(@Args('id') id: string, @ClerkUser() user: any) {
        if (!user.activeCompanyId) {
            throw new BadRequestException('Action requires an active company context');
        }
        return this.supplierService.unarchive(id, user.activeCompanyId);
    }

    @ResolveField(() => Int, { name: 'productsCount' })
    async productsCount(@Parent() supplier: Supplier): Promise<number> {
        return this.supplierService.getProductCount(supplier.id);
    }
}
