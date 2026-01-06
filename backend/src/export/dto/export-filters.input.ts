import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ExportFiltersInput {
  @Field(() => String, { nullable: true })
  dateFrom?: string;

  @Field(() => String, { nullable: true })
  dateTo?: string;

  @Field(() => [String], { nullable: true })
  productIds?: string[];

  @Field(() => [String], { nullable: true })
  warehouseIds?: string[];
}
