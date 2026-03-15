import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BillingResolver } from './billing.resolver';
import { BillingService } from './billing.service';
import { BillingPayment } from './entities/billing-payment.entity';
import { CompanySettings } from '../company/company-settings.entity';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BillingPayment, CompanySettings]),
    ConfigModule,
    AuthModule,
  ],
  controllers: [RazorpayWebhookController],
  providers: [BillingResolver, BillingService],
  exports: [BillingService],
})
export class BillingModule {}
