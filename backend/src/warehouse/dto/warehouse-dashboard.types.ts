import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { StockHealthStatus } from '../../inventory/types/stock-health.types';

@ObjectType()
export class WarehouseKPIs {
  @Field(() => Int)
  totalProducts: number;

  @Field(() => Int)
  totalQuantity: number;

  @Field(() => Int)
  lowStockCount: number;

  @Field(() => Int)
  outOfStockCount: number;

  @Field(() => Int)
  adjustmentsToday: number;

  @Field(() => Int)
  transfersToday: number;
}

@ObjectType()
export class ProductPreview {
  @Field()
  name: string;

  @Field()
  sku: string;
}

@ObjectType()
export class LowStockPreviewItem {
  @Field(() => ProductPreview)
  product: ProductPreview;

  @Field(() => Int)
  quantity: number;

  @Field(() => StockHealthStatus)
  status: StockHealthStatus;
}

@ObjectType()
export class MovementPerformer {
  @Field({ nullable: true })
  name: string;
}

@ObjectType()
export class DashboardMovementItem {
  @Field()
  type: string;

  @Field(() => Int, { nullable: true })
  quantity: number;

  @Field(() => ProductPreview)
  product: ProductPreview;

  @Field()
  createdAt: Date;

  @Field(() => MovementPerformer, { nullable: true })
  performedBy: MovementPerformer;
}
