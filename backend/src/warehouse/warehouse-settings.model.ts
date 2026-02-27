import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class WarehouseSettings {
  @Field(() => ID)
  id: string;

  @Field()
  warehouse_id: string;

  @Field()
  created_at: Date;
}
