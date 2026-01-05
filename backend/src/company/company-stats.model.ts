import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class CompanyStats {
  @Field(() => Int)
  totalStaff: number;

  @Field(() => Float)
  totalInventoryValue: number;
}
