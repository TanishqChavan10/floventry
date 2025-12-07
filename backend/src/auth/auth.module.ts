import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserCompany } from './entities/user-company.entity';
import { UserWarehouse } from './entities/user-warehouse.entity';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserCompany, UserWarehouse]), ConfigModule],
  providers: [AuthResolver, ClerkService, ClerkAuthGuard],
  exports: [ClerkService, ClerkAuthGuard],
})
export class AuthModule {}
