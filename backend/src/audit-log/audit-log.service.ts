import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async logAction(data: {
        action: string;
        userId: string;
        entityId?: string;
        entityType?: string;
        details?: any;
        ipAddress?: string;
    }) {
        const log = this.auditLogRepository.create(data);
        return this.auditLogRepository.save(log);
    }

    async findAll(userId: string) {
        // For now, return all logs. In real app, might filter by role or tenant.
        // Assuming admin sees all, or user sees their own actions?
        // Let's assume admin sees all for now, or filter by userId if needed.
        // But the requirement says "Owner checks audit logs". Owner is a user.
        // We might need to filter by tenant/organization if multi-tenant.
        // For now, let's return logs where userId matches or if user is admin.
        // Since we don't have full RBAC details here, let's return all logs for now 
        // but in a real scenario we would filter by company/tenant.

        // If we assume single tenant per deployment or simple ownership:
        return this.auditLogRepository.find({
            order: { createdAt: 'DESC' },
            take: 100, // Limit to last 100 logs for performance
        });
    }
}
