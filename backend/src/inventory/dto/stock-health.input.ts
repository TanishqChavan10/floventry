import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, ValidateIf } from 'class-validator';

@InputType()
export class UpdateStockThresholdsInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Min stock level must be non-negative' })
  min_stock_level?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Reorder point must be non-negative' })
  @ValidateIf(
    (o) => o.min_stock_level !== undefined && o.reorder_point !== undefined,
  )
  reorder_point?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Max stock level must be non-negative' })
  max_stock_level?: number;
}
