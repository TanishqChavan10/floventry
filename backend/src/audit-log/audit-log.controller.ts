import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { RestAuthGuard } from '../auth/guards/rest-auth.guard';
import { RestUser } from '../auth/decorators/rest-user.decorator';

@Controller('audit-logs')
@UseGuards(RestAuthGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    findAll(@RestUser() user: any) {
        return this.auditLogService.findAll(user.clerkId);
    }
}
