import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLogService } from './audit-log.service';
import {
  AuditLogResponse,
  AuditLogFilterInput,
} from './dto/audit-log.dto';
import { PaginationInput } from '../common/dto/pagination.types';

@Resolver()
export class AuditLogResolver {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Company Audit Logs Query
   * RBAC: OWNER and ADMIN only
   */
  @Query(() => AuditLogResponse, { name: 'companyAuditLogs' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async companyAuditLogs(
    @Args('filters', { type: () => AuditLogFilterInput, nullable: true })
    filters: AuditLogFilterInput,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination: PaginationInput,
    @CurrentUser() user: any,
  ): Promise<AuditLogResponse> {
    const companyId = user?.activeCompanyId;

    if (!companyId) {
      throw new Error('Active company required');
    }

    return this.auditLogService.findAll(companyId, filters, pagination);
  }
}
