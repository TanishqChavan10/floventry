import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class CompanySettings {
  @Field(() => Int)
  settings_id: number;

  @Field(() => Int)
  company_id: number;

  @Field({ nullable: true })
  theme?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  language?: string;

  @Field({ nullable: true })
  notifications_enabled?: boolean;

  @Field({ nullable: true })
  auto_backup?: boolean;

  @Field({ nullable: true })
  max_users?: number;

  @Field({ nullable: true })
  storage_limit_gb?: number;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  updated_at?: Date;
}