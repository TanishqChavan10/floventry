import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateWarehouseInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  contact_person?: string;

  @Field({ nullable: true })
  contact_phone?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  is_default?: boolean;
}

@InputType()
export class UpdateWarehouseSettingsInput {
  @Field({ nullable: true })
  low_stock_threshold?: number;

  @Field({ nullable: true })
  expiry_warning_days?: number;

  @Field({ nullable: true })
  allow_negative_stock?: boolean;

  @Field({ nullable: true })
  allow_inbound_transfers?: boolean;

  @Field({ nullable: true })
  allow_outbound_transfers?: boolean;

  @Field({ nullable: true })
  require_transfer_approval?: boolean;
}
