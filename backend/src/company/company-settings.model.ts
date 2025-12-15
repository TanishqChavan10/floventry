import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class CompanySettings {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  company_id: string;

  // Business & Profile
  @Field({ nullable: true })
  theme?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  language?: string;

  // Inventory
  @Field(() => Int, { nullable: true })
  low_stock_threshold?: number;

  @Field(() => Int, { nullable: true })
  expiry_warning_days?: number;

  @Field({ nullable: true })
  enable_expiry_tracking?: boolean;

  @Field({ nullable: true })
  allow_negative_stock?: boolean;

  @Field({ nullable: true })
  stock_valuation_method?: string;

  // PO Settings
  @Field({ nullable: true })
  po_require_approval?: boolean;

  @Field(() => Float, { nullable: true })
  po_approval_threshold?: number;

  @Field({ nullable: true })
  po_auto_receive?: boolean;

  @Field({ nullable: true })
  po_default_payment_terms?: string;

  // Notifications
  @Field({ nullable: true })
  notify_low_stock?: boolean;

  @Field({ nullable: true })
  notify_expiry?: boolean;

  @Field({ nullable: true })
  notify_po_status?: boolean;

  @Field({ nullable: true })
  notify_transfers?: boolean;

  // Access
  @Field({ nullable: true })
  default_user_role?: string;

  @Field({ nullable: true })
  restrict_manager_catalog?: boolean;

  @Field({ nullable: true })
  restrict_staff_stock?: boolean;

  @Field(() => Int, { nullable: true })
  session_timeout_minutes?: number;

  // Audit
  @Field({ nullable: true })
  enable_audit_logs?: boolean;

  @Field(() => Int, { nullable: true })
  audit_retention_days?: number;

  @Field({ nullable: true })
  track_stock_adjustments?: boolean;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  updated_at?: Date;
}