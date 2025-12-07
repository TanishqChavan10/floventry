import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.model';
import { CompanySettings } from './company-settings.model';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanySettingsInput } from './dto/update-company-settings.input';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/enums/role.enum';

@Resolver(() => Company)
export class CompanyResolver {
  constructor(private readonly companyService: CompanyService) { }

  @Query(() => [Company])
  @UseGuards(ClerkAuthGuard)
  async companies(@Context() context: any) {
    const userId = context.req.user.id; // Assuming Clerk user id
    return this.companyService.getCompaniesByUser(userId);
  }

  @Query(() => Company)
  @UseGuards(ClerkAuthGuard)
  async company(@Args('id') id: string) {
    return this.companyService.getCompanyById(id);
  }

  @Mutation(() => Company)
  @UseGuards(ClerkAuthGuard)
  async createCompany(
    @Args('input') input: CreateCompanyInput,
    @Context() context: any,
  ) {
    const ownerId = context.req.user.id;
    return this.companyService.createCompany(input, ownerId);
  }

  @Mutation(() => CompanySettings)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCompanySettings(
    @Args('input') input: UpdateCompanySettingsInput,
    @Context() context: any,
  ) {
    // TODO: Get companyId from context or args
    const companyId = 'placeholder-uuid'; // Placeholder
    return this.companyService.updateSettings(companyId, input);
  }

  @Mutation(() => Company)
  @UseGuards(ClerkAuthGuard)
  async switchCompany(
    @Args('companyId') companyId: string,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.companyService.switchCompany(userId, companyId);
  }
}
