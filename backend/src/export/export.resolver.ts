import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExportService } from './export.service';
import { CompanySettings } from '../company/company-settings.entity';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { ExportFiltersInput } from './dto/export-filters.input';

@Resolver()
export class ExportResolver {
  constructor(
    private readonly exportService: ExportService,
    @InjectRepository(CompanySettings)
    private readonly companySettingsRepository: Repository<CompanySettings>,
  ) {}

  /** Throws if the company is not on the Pro plan. */
  private async assertPremium(companyId: string): Promise<void> {
    const settings = await this.companySettingsRepository.findOne({
      where: { company_id: companyId },
    });
    if (!settings?.is_premium) {
      throw new BadRequestException(
        'Expiry exports require the Pro plan. Upgrade to access expiry risk reports and expiry lot exports.',
      );
    }
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard)
  async exportStockSnapshot(
    @ClerkUser() user: any,
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
  @UseGuards(ClerkAuthGuard)
  async exportStockMovements(
    @ClerkUser() user: any,
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
  @UseGuards(ClerkAuthGuard)
  async exportAdjustments(
    @ClerkUser() user: any,
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
  @UseGuards(ClerkAuthGuard)
  async exportExpiryLots(
    @ClerkUser() user: any,
    @Args('warehouseId') warehouseId: string,
    @Args('filters', { type: () => ExportFiltersInput, nullable: true })
    filters?: ExportFiltersInput,
  ): Promise<string> {
    await this.assertPremium(user.activeCompanyId);
    return this.exportService.exportExpiryLots(
      warehouseId,
      filters,
      user.activeCompanyId,
    );
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
    await this.assertPremium(user.activeCompanyId);
    return this.exportService.exportExpiryRisk(user.activeCompanyId, filters);
  }
}
