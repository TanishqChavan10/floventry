import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { CompanyDashboardService } from './company-dashboard.service';
import { CompanyDashboardData } from './dto/company-dashboard.types';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => CompanyDashboardData)
@UseGuards(ClerkAuthGuard, RolesGuard)
export class CompanyDashboardResolver {
  constructor(private readonly dashboardService: CompanyDashboardService) {}

  @Query(() => CompanyDashboardData)
  @Roles(Role.OWNER, Role.ADMIN)
  async companyDashboard(@ClerkUser() user: any): Promise<CompanyDashboardData> {
    if (!user?.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.dashboardService.getCompanyDashboard(user.activeCompanyId);
  }
}
