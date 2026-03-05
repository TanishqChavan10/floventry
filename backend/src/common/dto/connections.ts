import { ObjectType, Field } from '@nestjs/graphql';
import { CursorPageInfo } from './pagination.types';
import { Product } from '../../inventory/entities/product.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { StockMovement } from '../../inventory/entities/stock-movement.entity';
import { CompanyAuditLog } from '../../audit/entities/company-audit-log.entity';

// ── Product Connection ──

@ObjectType()
export class ProductEdge {
  @Field(() => Product)
  node: Product;

  @Field()
  cursor: string;
}

@ObjectType()
export class ProductConnection {
  @Field(() => [ProductEdge])
  edges: ProductEdge[];

  @Field(() => CursorPageInfo)
  pageInfo: CursorPageInfo;
}

// ── Notification Connection ──

@ObjectType()
export class NotificationEdge {
  @Field(() => Notification)
  node: Notification;

  @Field()
  cursor: string;
}

@ObjectType()
export class NotificationConnection {
  @Field(() => [NotificationEdge])
  edges: NotificationEdge[];

  @Field(() => CursorPageInfo)
  pageInfo: CursorPageInfo;
}

// ── PurchaseOrder Connection ──

@ObjectType()
export class PurchaseOrderEdge {
  @Field(() => PurchaseOrder)
  node: PurchaseOrder;

  @Field()
  cursor: string;
}

@ObjectType()
export class PurchaseOrderConnection {
  @Field(() => [PurchaseOrderEdge])
  edges: PurchaseOrderEdge[];

  @Field(() => CursorPageInfo)
  pageInfo: CursorPageInfo;
}

// ── StockMovement Connection ──

@ObjectType()
export class StockMovementEdge {
  @Field(() => StockMovement)
  node: StockMovement;

  @Field()
  cursor: string;
}

@ObjectType()
export class StockMovementConnection {
  @Field(() => [StockMovementEdge])
  edges: StockMovementEdge[];

  @Field(() => CursorPageInfo)
  pageInfo: CursorPageInfo;
}

// ── AuditLog Connection ──

@ObjectType()
export class AuditLogEdge {
  @Field(() => CompanyAuditLog)
  node: CompanyAuditLog;

  @Field()
  cursor: string;
}

@ObjectType()
export class AuditLogConnection {
  @Field(() => [AuditLogEdge])
  edges: AuditLogEdge[];

  @Field(() => CursorPageInfo)
  pageInfo: CursorPageInfo;
}
