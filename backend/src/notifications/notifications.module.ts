import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { Notification } from './entities/notification.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, UserCompany, UserWarehouse]),
    AuthModule,
  ],
  providers: [NotificationsService, NotificationsResolver],
  exports: [NotificationsService],
})
export class NotificationsModule {}
