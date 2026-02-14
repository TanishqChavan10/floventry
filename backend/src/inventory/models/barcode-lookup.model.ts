import { Field, ObjectType } from '@nestjs/graphql';
import { Product } from '../entities/product.entity';
import { ProductBarcodeUnitType } from '../entities/product-barcode-unit.entity';

@ObjectType()
export class BarcodeLookupResult {
  @Field(() => Product)
  product: Product;

  @Field()
  barcode_value: string;

  @Field(() => ProductBarcodeUnitType)
  unit_type: ProductBarcodeUnitType;

  @Field()
  quantity_multiplier: number;
}
