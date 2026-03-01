import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { CompanyDashboardService } from './company-dashboard.service';
import { CompanyDashboardData } from './dto/company-dashboard.types';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => CompanyDashboardData)
@UseGuards(AuthGuard, RolesGuard)
export class CompanyDashboardResolver {
  constructor(private readonly dashboardService: CompanyDashboardService) {}

  @Query(() => CompanyDashboardData)
  @Roles(Role.OWNER, Role.ADMIN)
  async companyDashboard(
    @CurrentUser() user: any,
  ): Promise<CompanyDashboardData> {
    if (!user?.activeCompanyId) {
      throw new BadRequestException('Active company required');
    }

    return this.dashboardService.getCompanyDashboard(user.activeCompanyId);
  }
}
