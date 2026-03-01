import { InputType, Field } from '@nestjs/graphql';
import { GRNStatus } from '../entities/goods-receipt-note.entity';

@InputType()
export class GRNItemInput {
  @Field()
  purchase_order_item_id: string;

  @Field()
  received_quantity: number;

  @Field({ nullable: true })
  expiry_date?: Date;
}

@InputType()
export class CreateGRNInput {
  @Field()
  warehouse_id: string;

  @Field()
  purchase_order_id: string;

  @Field({ nullable: true })
  received_at?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [GRNItemInput])
  items: GRNItemInput[];
}

@InputType()
export class UpdateGRNInput {
  @Field({ nullable: true })
  received_at?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [GRNItemInput], { nullable: true })
  items?: GRNItemInput[];
}

@InputType()
export class GRNFilterInput {
  @Field({ nullable: true })
  warehouse_id?: string;

  @Field(() => GRNStatus, { nullable: true })
  status?: GRNStatus;

  @Field({ nullable: true })
  purchase_order_id?: string;

  @Field({ nullable: true })
  from_date?: Date;

  @Field({ nullable: true })
  to_date?: Date;

  @Field({ nullable: true, defaultValue: 50 })
  limit?: number;

  @Field({ nullable: true, defaultValue: 0 })
  offset?: number;
}
