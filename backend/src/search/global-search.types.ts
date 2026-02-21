import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Category } from '../inventory/entities/category.entity';

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
export class GlobalSearchPurchaseOrder {
  @Field(() => ID)
  id: string;

  @Field()
  po_number: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  supplier_name?: string;
}

@ObjectType()
export class GlobalSearchSalesOrder {
  @Field(() => ID)
  id: string;

  @Field()
  order_number: string;

  @Field()
  status: string;

  @Field()
  customer_name: string;
}

@ObjectType()
export class GlobalSearchResponse {
  @Field(() => [Product])
  products: Product[];

  @Field(() => [Warehouse])
  warehouses: Warehouse[];

  @Field(() => [GlobalSearchDocument])
  documents: GlobalSearchDocument[];

  @Field(() => [Supplier])
  suppliers: Supplier[];

  @Field(() => [Category])
  categories: Category[];

  @Field(() => [GlobalSearchPurchaseOrder])
  purchaseOrders: GlobalSearchPurchaseOrder[];

  @Field(() => [GlobalSearchSalesOrder])
  salesOrders: GlobalSearchSalesOrder[];
}
