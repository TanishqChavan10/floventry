import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class UpdateCompanySettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  theme?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  low_stock_threshold?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  expiry_warning_days?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enable_expiry_tracking?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stock_valuation_method?: string;

  // PO Settings
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  po_require_approval?: boolean;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  po_approval_threshold?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  po_auto_receive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  po_default_payment_terms?: string;

  // Notifications
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notify_low_stock?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notify_expiry?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notify_po_status?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notify_transfers?: boolean;

  // Access
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  default_user_role?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  restrict_manager_catalog?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  restrict_staff_stock?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  session_timeout_minutes?: number;

  // Audit
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enable_audit_logs?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  audit_retention_days?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  track_stock_adjustments?: boolean;
}
