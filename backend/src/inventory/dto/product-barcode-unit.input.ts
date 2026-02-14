import { Field, ID, InputType, Float } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ProductBarcodeUnitType } from '../entities/product-barcode-unit.entity';

@InputType()
export class UpsertProductBarcodeUnitInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field(() => ID)
  @IsUUID()
  product_id: string;

  @Field()
  @IsString()
  barcode_value: string;

  @Field(() => ProductBarcodeUnitType)
  @IsEnum(ProductBarcodeUnitType)
  unit_type: ProductBarcodeUnitType;

  @Field(() => Float)
  @IsNumber()
  @Min(0.001)
  @Max(1000000)
  quantity_multiplier: number;

  @Field({ defaultValue: false })
  @IsBoolean()
  is_primary: boolean;
}
