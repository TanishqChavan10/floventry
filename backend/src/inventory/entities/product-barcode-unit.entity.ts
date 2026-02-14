import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ProductBarcodeUnitType {
  PIECE = 'piece',
  PACK = 'pack',
  CARTON = 'carton',
}

registerEnumType(ProductBarcodeUnitType, {
  name: 'ProductBarcodeUnitType',
  description: 'Packaging unit type associated with a barcode',
});

@ObjectType()
@Entity('product_barcode_units')
@Index(['company_id', 'barcode_value'], { unique: true })
@Index(['company_id', 'product_id'])
export class ProductBarcodeUnit {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  company_id: string;

  @Field(() => ID)
  @Column('uuid')
  product_id: string;

  @Field()
  @Column('text')
  barcode_value: string;

  @Field(() => ProductBarcodeUnitType)
  @Column({
    type: 'enum',
    enum: ProductBarcodeUnitType,
    default: ProductBarcodeUnitType.PIECE,
  })
  unit_type: ProductBarcodeUnitType;

  @Field()
  @Column('decimal', { precision: 12, scale: 3, default: 1 })
  quantity_multiplier: number;

  @Field()
  @Column('boolean', { default: false })
  is_primary: boolean;

  @Field()
  @CreateDateColumn()
  created_at: Date;
}
