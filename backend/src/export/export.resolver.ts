import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExportService } from './export.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExportFiltersInput } from './dto/export-filters.input';

@Resolver()
export class ExportResolver {
  constructor(private readonly exportService: ExportService) {}

  @Mutation(() => String)
  @UseGuards(AuthGuard)
  async exportStockSnapshot(
    @CurrentUser() user: any,
    @Args('warehouseId') warehouseId: string,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportStockSnapshot(
      warehouseId,
      filters,
      user.activeCompanyId,
    );
  }

  @Mutation(() => String)
  @UseGuards(AuthGuard)
  async exportStockMovements(
    @CurrentUser() user: any,
    @Args('warehouseId') warehouseId: string,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportStockMovements(
      warehouseId,
      filters,
      user.activeCompanyId,
    );
  }

  @Mutation(() => String)
  @UseGuards(AuthGuard)
  async exportAdjustments(
    @CurrentUser() user: any,
    @Args('warehouseId') warehouseId: string,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportAdjustments(
      warehouseId,
      filters,
      user.activeCompanyId,
    );
  }

  @Mutation(() => String)
  @UseGuards(AuthGuard)
  async exportExpiryLots(
    @CurrentUser() user: any,
    @Args('warehouseId') warehouseId: string,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportExpiryLots(
      warehouseId,
      filters,
      user.activeCompanyId,
    );
  }

  @Mutation(() => String)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async exportInventorySummary(
    @CurrentUser() user: any,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportInventorySummary(
      user.activeCompanyId,
      filters,
    );
  }

  @Mutation(() => String)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async exportCompanyMovements(
    @CurrentUser() user: any,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportCompanyMovements(
      user.activeCompanyId,
      filters,
    );
  }

  @Mutation(() => String)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async exportExpiryRisk(
    @CurrentUser() user: any,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    return this.exportService.exportExpiryRisk(user.activeCompanyId, filters);
  }
}
