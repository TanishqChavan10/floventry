import { Field, Int, ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class CompanyDashboardMovementsWindow {
  @Field(() => Int)
  in_units: number;

  @Field(() => Int)
  out_units: number;
}

@ObjectType()
export class CompanyDashboardKPIs {
  @Field(() => Int)
  total_skus: number;

  @Field(() => Int)
  warehouses: number;

  @Field(() => Int)
  total_stock_units: number;

  @Field(() => Int)
  stock_at_risk: number;

  @Field(() => Int)
  expired_stock_units: number;

  @Field(() => CompanyDashboardMovementsWindow)
  movements_7d: CompanyDashboardMovementsWindow;

  @Field(() => CompanyDashboardMovementsWindow)
  movements_30d: CompanyDashboardMovementsWindow;
}

@ObjectType()
export class StockStatusDistribution {
  @Field(() => Int)
  ok: number;

  @Field(() => Int)
  low: number;

  @Field(() => Int)
  critical: number;
}

@ObjectType()
export class ExpiryRiskDistribution {
  @Field(() => Int)
  ok: number;

  @Field(() => Int)
  expiring_soon: number;

  @Field(() => Int)
  expired: number;
}

@ObjectType()
export class WarehouseHealthSnapshotItem {
  @Field(() => ID)
  warehouse_id: string;

  @Field()
  warehouse_name: string;

  @Field({ nullable: true })
  warehouse_slug?: string;

  @Field(() => Int)
  ok_percent: number;

  @Field()
  risk_badge: string; // OK | WARNING | CRITICAL
}

@ObjectType()
export class RecentInventoryEvent {
  @Field()
  event_type: string; // GRN_POSTED | ISSUE_POSTED | TRANSFER_POSTED | ADJUSTMENT

  @Field({ nullable: true })
  reference_number?: string;

  @Field({ nullable: true })
  warehouse_name?: string;

  @Field({ nullable: true })
  performed_by?: string;

  @Field(() => GraphQLISODateTime)
  occurred_at: Date;
}

@ObjectType()
export class ActiveAlertsSummary {
  @Field(() => Int)
  critical: number;

  @Field(() => Int)
  warning: number;

  @Field(() => Int)
  low_stock: number;

  @Field(() => Int)
  expiry: number;

  @Field(() => Int)
  import_issues: number;
}

@ObjectType()
export class CompanyDashboardData {
  @Field(() => CompanyDashboardKPIs)
  kpis: CompanyDashboardKPIs;

  @Field(() => StockStatusDistribution)
  stock_status_distribution: StockStatusDistribution;

  @Field(() => ExpiryRiskDistribution)
  expiry_risk_distribution: ExpiryRiskDistribution;

  @Field(() => [WarehouseHealthSnapshotItem])
  warehouse_health_snapshot: WarehouseHealthSnapshotItem[];

  @Field(() => [RecentInventoryEvent])
  recent_activity: RecentInventoryEvent[];

  @Field(() => ActiveAlertsSummary)
  active_alerts_summary: ActiveAlertsSummary;
}
