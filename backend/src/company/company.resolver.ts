import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company, SwitchCompanyResponse } from './company.model';
import { CompanyStats } from './company-stats.model';
import { CompanySettings } from './company-settings.model';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';
import { UpdateCompanySettingsInput } from './dto/update-company-settings.input';
import { UpdateCompanyBarcodeSettingsInput } from './dto/update-company-barcode-settings.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';

@Resolver(() => Company)
export class CompanyResolver {
  constructor(
    private readonly companyService: CompanyService,
    private readonly authService: AuthService,
  ) {}

  // --- Barcode settings fields (resolved from Company entity snake_case columns) ---
  @ResolveField(() => String, { name: 'barcodePrefix' })
  barcodePrefix(@Parent() company: any): string {
    return (company?.barcode_prefix ?? 'FLO-') as string;
  }

  @ResolveField(() => Int, { name: 'barcodePadding' })
  barcodePadding(@Parent() company: any): number {
    const value = company?.barcode_padding;
    return typeof value === 'number' && Number.isFinite(value) ? value : 6;
  }

  @ResolveField(() => Float, { name: 'barcodeNextNumber', nullable: true })
  barcodeNextNumber(
    @Parent() company: any,
    @CurrentUser() user: any,
  ): number | null {
    // Admin/owner only; also only for the active company.
    const role = typeof user?.role === 'string' ? user.role.toUpperCase() : '';
    const isPrivileged = role === Role.ADMIN || role === Role.OWNER;
    if (!isPrivileged) return null;
    if (user?.activeCompanyId && company?.id && user.activeCompanyId !== company.id) return null;

    const raw = company?.barcode_next_number;
    const num = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN;
    return Number.isFinite(num) ? num : null;
  }

  @ResolveField(() => String, { name: 'barcodeSuffix' })
  barcodeSuffix(@Parent() company: any): string {
    return (company?.barcode_suffix ?? '') as string;
  }

  @Query(() => [Company])
  @UseGuards(AuthGuard)
  async companies(@CurrentUser() authUser: { authId: string } | null) {
    if (!authUser?.authId) {
      return [];
    }

    // Ensure user exists in database
    const user = await this.authService.syncUser(authUser.authId);
    if (!user) {
      return [];
    }

    return this.companyService.getCompaniesByUser(user.id);
  }

  @Query(() => Company)
  @UseGuards(AuthGuard)
  async company(@Args('id') id: string, @CurrentUser() user: any) {
    await this.companyService.assertActiveMembership(user.id, id);
    return this.companyService.getCompanyById(id);
  }

  @Query(() => Company)
  @UseGuards(AuthGuard)
  async companyBySlug(@Args('slug') slug: string, @CurrentUser() user: any) {
    const company = await this.companyService.getCompanyBySlug(slug);
    await this.companyService.assertActiveMembership(user.id, company.id);
    return company;
  }

  @Query(() => CompanyStats)
  @UseGuards(AuthGuard)
  async companyStats(@Args('companyId') companyId: string, @CurrentUser() user: any) {
    await this.companyService.assertActiveMembership(user.id, companyId);
    return this.companyService.getCompanyStats(companyId);
  }

  @Mutation(() => Company)
  @UseGuards(AuthGuard)
  async createCompany(
    @Args('input') input: CreateCompanyInput,
    @CurrentUser() authUser: { authId: string } | null,
  ) {
    if (!authUser?.authId) {
      throw new Error('User not authenticated');
    }

    // Ensure user exists in database (sync from Supabase if needed)
    const user = await this.authService.syncUser(authUser.authId);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return this.companyService.createCompany(input, user.id);
  }

  @Mutation(() => CompanySettings)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async updateCompanySettings(
    @Args('companyId') companyId: string,
    @Args('input') input: UpdateCompanySettingsInput,
    @CurrentUser() user: any,
  ) {
    // Security check: ensure user belongs to company (Role guard handles role, but need to check if company matches active or owned)
    if (user.activeCompanyId !== companyId) {
      throw new Error(
        'Unauthorized: You can only update settings for your active company',
      );
    }
    return this.companyService.updateSettings(companyId, input);
  }

  @Mutation(() => Company)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  async updateCompanyBarcodeSettings(
    @Args('companyId') companyId: string,
    @Args('input') input: UpdateCompanyBarcodeSettingsInput,
    @CurrentUser() user: any,
  ) {
    if (user.activeCompanyId !== companyId) {
      throw new Error(
        'Unauthorized: You can only update barcode settings for your active company',
      );
    }

    return this.companyService.updateBarcodeSettings(companyId, input, user);
  }

  @Mutation(() => Company)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async updateCompany(
    @Args('id') id: string,
    @Args('input') input: UpdateCompanyInput,
    @CurrentUser() user: any,
  ) {
    // Security check: ensure user belongs to company or is owner
    if (user.activeCompanyId !== id) {
      throw new Error('Unauthorized');
    }
    return this.companyService.updateCompany(id, input);
  }

  @Mutation(() => SwitchCompanyResponse)
  @UseGuards(AuthGuard)
  async switchCompany(
    @Args('companyId') companyId: string,
    @CurrentUser() authUser: { authId: string } | null,
  ) {
    if (!authUser?.authId) {
      throw new Error('User not authenticated');
    }

    // Ensure user exists in database
    const user = await this.authService.syncUser(authUser.authId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.companyService.switchCompany(user.id, companyId);
    return {
      success: true,
      activeCompanyId: companyId,
    };
  }
}
