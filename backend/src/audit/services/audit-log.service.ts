import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyAuditLog } from '../entities/company-audit-log.entity';
import { AuditAction, AuditEntityType } from '../enums/audit.enums';

export interface RecordAuditLogInput {
  companyId: string;
  actor: {
    id: string;
    email: string;
    role: string; // Store as string to avoid enum conflicts
  };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  action?: AuditAction;
  entityType?: AuditEntityType;
  actorUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface AuditLogPageInfo {
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogResponse {
  items: CompanyAuditLog[];
  pageInfo: AuditLogPageInfo;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(CompanyAuditLog)
    private readonly auditLogRepository: Repository<CompanyAuditLog>,
  ) {}

  /**
   * Record an audit log entry
   * Fire-and-forget: Never throws errors to prevent breaking main transactions
   */
  async record(input: RecordAuditLogInput): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        company_id: input.companyId,
        actor_user_id: input.actor.id,
        actor_email: input.actor.email,
        actor_role: input.actor.role,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId,
        metadata: input.metadata,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.debug(
        `Audit log recorded: ${input.action} by ${input.actor.email}`,
      );
    } catch (error) {
      // Fire-and-forget: Log the error but never propagate it
      this.logger.error('Failed to record audit log', error);
      // Continue normal execution - do not throw
    }
  }

  /**
   * Query audit logs with filters and pagination
   */
  async findAll(
    companyId: string,
    filters?: AuditLogFilters,
    pagination?: PaginationInput,
  ): Promise<AuditLogResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.company_id = :companyId', { companyId })
      .leftJoinAndSelect('audit.actor', 'user');

    // Apply filters
    if (filters?.action) {
      queryBuilder.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    if (filters?.entityType) {
      queryBuilder.andWhere('audit.entity_type = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters?.actorUserId) {
      queryBuilder.andWhere('audit.actor_user_id = :actorUserId', {
        actorUserId: filters.actorUserId,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('audit.created_at >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('audit.created_at <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    // Default sort: Newest first
    queryBuilder.orderBy('audit.created_at', 'DESC');

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const items = await queryBuilder.getMany();

    return {
      items,
      pageInfo: {
        total,
        page,
        limit,
        hasNextPage: skip + items.length < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
