import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SupplierProduct {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  sku: string;

  @Field()
  unit: string;
}
