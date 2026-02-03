import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company, SwitchCompanyResponse } from './company.model';
import { CompanyStats } from './company-stats.model';
import { CompanySettings } from './company-settings.model';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';
import { UpdateCompanySettingsInput } from './dto/update-company-settings.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { ClerkService } from '../auth/clerk.service';

@Resolver(() => Company)
export class CompanyResolver {
  constructor(
    private readonly companyService: CompanyService,
    private readonly clerkService: ClerkService,
  ) {}

  @Query(() => [Company])
  @UseGuards(ClerkAuthGuard)
  async companies(@ClerkUser() clerkUser: { clerkId: string } | null) {
    if (!clerkUser?.clerkId) {
      return [];
    }

    // Ensure user exists in database
    const user = await this.clerkService.syncUser(clerkUser.clerkId);
    if (!user) {
      return [];
    }

    return this.companyService.getCompaniesByUser(user.id);
  }

  @Query(() => Company)
  @UseGuards(ClerkAuthGuard)
  async company(@Args('id') id: string) {
    return this.companyService.getCompanyById(id);
  }

  @Query(() => Company)
  @UseGuards(ClerkAuthGuard)
  async companyBySlug(@Args('slug') slug: string) {
    return this.companyService.getCompanyBySlug(slug);
  }

  @Query(() => CompanyStats)
  @UseGuards(ClerkAuthGuard)
  async companyStats(@Args('companyId') companyId: string) {
    return this.companyService.getCompanyStats(companyId);
  }

  @Mutation(() => Company)
  @UseGuards(ClerkAuthGuard)
  async createCompany(
    @Args('input') input: CreateCompanyInput,
    @ClerkUser() clerkUser: { clerkId: string } | null,
  ) {
    if (!clerkUser?.clerkId) {
      throw new Error('User not authenticated');
    }

    // Ensure user exists in database (sync from Clerk if needed)
    const user = await this.clerkService.syncUser(clerkUser.clerkId);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return this.companyService.createCompany(input, user.id);
  }

  @Mutation(() => CompanySettings)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async updateCompanySettings(
    @Args('companyId') companyId: string,
    @Args('input') input: UpdateCompanySettingsInput,
    @ClerkUser() user: any,
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
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async updateCompany(
    @Args('id') id: string,
    @Args('input') input: UpdateCompanyInput,
    @ClerkUser() user: any,
  ) {
    // Security check: ensure user belongs to company or is owner
    if (user.activeCompanyId !== id) {
      throw new Error('Unauthorized');
    }
    return this.companyService.updateCompany(id, input);
  }

  @Mutation(() => SwitchCompanyResponse)
  @UseGuards(ClerkAuthGuard)
  async switchCompany(
    @Args('companyId') companyId: string,
    @ClerkUser() clerkUser: { clerkId: string } | null,
  ) {
    if (!clerkUser?.clerkId) {
      throw new Error('User not authenticated');
    }

    // Ensure user exists in database
    const user = await this.clerkService.syncUser(clerkUser.clerkId);
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
