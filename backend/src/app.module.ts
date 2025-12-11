import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { InventoryModule } from './inventory/inventory.module';
// import { SupplierModule } from './supplier/supplier.module';
// import { TransactionModule } from './transaction/transaction.module';
// import { RedisModule } from './redis';
// import { S3Module } from './s3';
import { CompanyModule } from './company/company.module';
import { InviteModule } from './invite/invite.module';
import { UserCompanyModule } from './user-company/user-company.module';
import { RoleModule } from './role/role.module';
import { CompanyContextMiddleware } from './common/middleware/company-context.middleware';
// import { ReportsModule } from './reports/reports.module';
// import { AuditLogModule } from './audit-log/audit-log.module';
// import { NotificationModule } from './notification/notification.module';
// import { IntegrationModule } from './integration/integration.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
    }),
    // RedisModule.forRootAsync(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      path: '/api/graphql',
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
    // InventoryModule,
    // SupplierModule,
    // TransactionModule,
    // RedisModule.forRootAsync(),
    // S3Module.forRootAsync(),
    CompanyModule,
    UserCompanyModule,
    InviteModule,
    EmailModule,
    // RoleModule,
    // ReportsModule,
    // AuditLogModule,
    // NotificationModule,
    // IntegrationModule,
    WarehouseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(CompanyContextMiddleware).forRoutes('*');
  }
}
