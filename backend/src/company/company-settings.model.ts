import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class CompanySettings {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  company_id: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  currency?: string;

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

  // Access
  @Field({ nullable: true })
  restrict_manager_catalog?: boolean;

  // Subscription / Plan flags
  // Subscription / Plan
  @Field({ nullable: false })
  plan: 'FREE' | 'STANDARD' | 'PRO';

  @Field({ nullable: true })
  cancel_at?: Date;

  @Field()
  created_at: Date;
}
