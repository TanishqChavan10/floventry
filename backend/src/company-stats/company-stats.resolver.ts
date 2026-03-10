import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CompanyStatsService } from './company-stats.service';
import { CompanyStats } from './company-stats.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => CompanyStats)
@UseGuards(AuthGuard, RolesGuard)
export class CompanyStatsResolver {
  constructor(private readonly statsService: CompanyStatsService) {}

  @Query(() => CompanyStats)
  @Roles(Role.OWNER, Role.ADMIN)
  async companyStats(@CurrentUser() user: any): Promise<CompanyStats> {
    if (!user?.activeCompanyId) {
      throw new Error('Active company required');
    }
    return this.statsService.getStats(user.activeCompanyId);
  }

  @Mutation(() => CompanyStats)
  @Roles(Role.OWNER, Role.ADMIN)
  async recalculateCompanyStats(@CurrentUser() user: any): Promise<CompanyStats> {
    if (!user?.activeCompanyId) {
      throw new Error('Active company required');
    }
    return this.statsService.recalculate(user.activeCompanyId);
  }
}
