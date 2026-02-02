import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyAuditLog } from './entities/company-audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogResolver } from './resolvers/audit-log.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CompanyAuditLog]),
        AuthModule, // Required for ClerkAuthGuard and RolesGuard dependencies
    ],
    providers: [AuditLogService, AuditLogResolver],
    exports: [AuditLogService], // Export service for use in other modules
})
export class AuditModule { }
