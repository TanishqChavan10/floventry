import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class WarehouseSettings {
  @Field(() => ID)
  id: string;

  @Field()
  warehouse_id: string;

  @Field({ nullable: true })
  low_stock_threshold?: number;

  @Field({ nullable: true })
  expiry_warning_days?: number;

  @Field({ nullable: true })
  allow_negative_stock?: boolean;

  @Field()
  allow_inbound_transfers: boolean;

  @Field()
  allow_outbound_transfers: boolean;

  @Field()
  require_transfer_approval: boolean;

  @Field()
  created_at: Date;
}
