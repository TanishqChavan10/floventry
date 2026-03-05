import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InventoryModule } from './inventory/inventory.module';
import { SupplierModule } from './supplier/supplier.module';
import { CompanyModule } from './company/company.module';
import { InviteModule } from './invite/invite.module';
import { UserCompanyModule } from './user-company/user-company.module';
import { RoleModule } from './role/role.module';
import { CompanyContextMiddleware } from './common/middleware/company-context.middleware';
import { WarehouseModule } from './warehouse/warehouse.module';
import { EmailModule } from './email/email.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SalesModule } from './sales/sales.module';
import { IssuesModule } from './issues/issues.module';
import { ExportModule } from './export/export.module';
import { ImportModule } from './import/import.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CompanyDashboardModule } from './company-dashboard/company-dashboard.module';
import { ExpiryScannerModule } from './expiry-scanner/expiry-scanner.module';
import { AuditModule } from './audit/audit.module';
import { GlobalSearchModule } from './search/global-search.module';
import { PubSubModule } from './common/pubsub/pubsub.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
    }),
    ScheduleModule.forRoot(), // Enable cron jobs
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      path: '/api/graphql',
      subscriptions: {
        'graphql-ws': {
          path: '/api/graphql',
        },
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),

        ssl: { rejectUnauthorized: false },

        autoLoadEntities: true,
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),

        logging: configService.get<string>('NODE_ENV') === 'development',

        // IMPORTANT for Supabase Pooler
        extra: {
          max: 10,
        },
        prepare: false, // Disable prepared statements
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    InventoryModule,
    SupplierModule,
    CompanyModule,
    UserCompanyModule,
    InviteModule,
    EmailModule,
    WarehouseModule,
    PurchaseOrdersModule,
    SalesModule,
    IssuesModule,
    ExportModule,
    ImportModule,
    NotificationsModule,
    CompanyDashboardModule,
    ExpiryScannerModule, // Automated expiry scanning
    AuditModule, // Company audit logs
    RoleModule,
    GlobalSearchModule,
    PubSubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(CompanyContextMiddleware).forRoutes('*');
  }
}
