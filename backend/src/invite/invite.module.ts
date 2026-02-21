import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteService } from './invite.service';
import { User } from '../auth/entities/user.entity';
import { Invite } from './invite.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { Company } from '../company/company.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { UserWarehouseService } from '../auth/user-warehouse.service';

import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InviteResolver } from './invite.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invite, UserCompany, User, Company, Warehouse]),
    AuthModule,
    AuditModule,
    EmailModule,
    NotificationsModule,
  ],
  providers: [InviteService, InviteResolver],
  exports: [InviteService],
})
export class InviteModule {}
