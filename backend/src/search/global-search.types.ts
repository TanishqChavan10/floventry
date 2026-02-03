import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';

export enum GlobalSearchDocumentType {
  GRN = 'GRN',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
}

registerEnumType(GlobalSearchDocumentType, {
  name: 'GlobalSearchDocumentType',
});

@ObjectType()
export class GlobalSearchDocument {
  @Field(() => ID)
  id: string;

  @Field(() => GlobalSearchDocumentType)
  type: GlobalSearchDocumentType;

  @Field()
  number: string;
}

@ObjectType()
export class GlobalSearchResponse {
  @Field(() => [Product])
  products: Product[];

  @Field(() => [Warehouse])
  warehouses: Warehouse[];

  @Field(() => [GlobalSearchDocument])
  documents: GlobalSearchDocument[];
}
