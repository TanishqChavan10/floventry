import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { ExportFiltersInput } from './dto/export-filters.input';

@Resolver()
export class ExportResolver {
    constructor(private readonly exportService: ExportService) { }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard)
    async exportStockSnapshot(
        @Args('warehouseId') warehouseId: string,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportStockSnapshot(warehouseId, filters);
    }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard)
    async exportStockMovements(
        @Args('warehouseId') warehouseId: string,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportStockMovements(warehouseId, filters);
    }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard)
    async exportAdjustments(
        @Args('warehouseId') warehouseId: string,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportAdjustments(warehouseId, filters);
    }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard)
    async exportExpiryLots(
        @Args('warehouseId') warehouseId: string,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportExpiryLots(warehouseId, filters);
    }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async exportInventorySummary(
        @ClerkUser() user: any,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportInventorySummary(
            user.activeCompanyId,
            filters,
        );
    }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async exportCompanyMovements(
        @ClerkUser() user: any,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportCompanyMovements(
            user.activeCompanyId,
            filters,
        );
    }

    @Mutation(() => String)
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async exportExpiryRisk(
        @ClerkUser() user: any,
        @Args('filters', { type: () => ExportFiltersInput, nullable: true })
        filters?: ExportFiltersInput,
    ): Promise<string> {
        return this.exportService.exportExpiryRisk(user.activeCompanyId, filters);
    }
}
