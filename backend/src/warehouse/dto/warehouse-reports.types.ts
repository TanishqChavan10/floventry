import { ObjectType, Field, Int, ID, InputType, registerEnumType, Float } from '@nestjs/graphql';
import { StockHealthStatus } from '../../inventory/types/stock-health.types';
import { MovementType } from '../../inventory/entities/stock-movement.entity';
import { StockHealthState } from '../../inventory/stock-health/stock-health.types';

// ============================================
// Stock Snapshot Types (CURRENT STATE ONLY)
// ============================================

@ObjectType()
export class StockSnapshotItem {
    @Field(() => ID)
    id: string;

    @Field()
    productName: string;

    @Field()
    sku: string;

    @Field({ nullable: true })
    categoryName: string;

    @Field(() => Int)
    quantity: number;

    @Field(() => Float, { nullable: true })
    usableQuantity: number;

    @Field(() => StockHealthState, { nullable: true })
    stockHealthState: StockHealthState;

    @Field({ nullable: true })
    nearestExpiry: string;

    @Field(() => Float, { nullable: true })
    expiringQuantity: number;

    @Field({ nullable: true })
    unit: string;

    @Field(() => StockHealthStatus)
    status: StockHealthStatus;

    @Field()
    lastUpdated: Date;
}

@ObjectType()
export class StockSnapshotResult {
    @Field(() => [StockSnapshotItem])
    items: StockSnapshotItem[];

    @Field(() => Int)
    total: number;
}

@InputType()
export class StockSnapshotFilters {
    @Field({ nullable: true })
    categoryId?: string;

    @Field(() => StockHealthStatus, { nullable: true })
    status?: StockHealthStatus;

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}

// ============================================
// Stock Movements Types (HISTORICAL)
// ============================================

@ObjectType()
export class StockMovementReportItem {
    @Field(() => ID)
    id: string;

    @Field()
    createdAt: Date;

    @Field()
    productName: string;

    @Field()
    sku: string;

    @Field(() => MovementType)
    type: MovementType;

    @Field(() => Int)
    quantity: number;

    @Field(() => Int, { nullable: true })
    previousQuantity: number;

    @Field(() => Int, { nullable: true })
    newQuantity: number;

    @Field({ nullable: true })
    referenceId: string;

    @Field({ nullable: true })
    referenceType: string;

    @Field({ nullable: true })
    reason: string;

    @Field({ nullable: true })
    performedBy: string;

    @Field({ nullable: true })
    userRole: string;
}

@ObjectType()
export class StockMovementResult {
    @Field(() => [StockMovementReportItem])
    items: StockMovementReportItem[];

    @Field(() => Int)
    total: number;
}

@InputType()
export class StockMovementFilters {
    @Field()
    fromDate: Date;

    @Field()
    toDate: Date;

    @Field(() => [MovementType], { nullable: true })
    types?: MovementType[];

    @Field({ nullable: true })
    productId?: string;

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}

// ============================================
// Adjustments Report Types (HISTORICAL)
// ============================================

@ObjectType()
export class AdjustmentReportItem {
    @Field(() => ID)
    id: string;

    @Field()
    createdAt: Date;

    @Field()
    productName: string;

    @Field()
    sku: string;

    @Field(() => MovementType)
    adjustmentType: MovementType; // ADJUSTMENT_IN or ADJUSTMENT_OUT

    @Field(() => Int)
    quantity: number;

    @Field({ nullable: true })
    reason: string;

    @Field({ nullable: true })
    referenceId: string;

    @Field({ nullable: true })
    performedBy: string;

    @Field({ nullable: true })
    userRole: string;
}

@ObjectType()
export class AdjustmentResult {
    @Field(() => [AdjustmentReportItem])
    items: AdjustmentReportItem[];

    @Field(() => Int)
    total: number;
}

@InputType()
export class AdjustmentFilters {
    @Field()
    fromDate: Date;

    @Field()
    toDate: Date;

    @Field({ nullable: true })
    productId?: string;

    @Field({ nullable: true })
    userId?: string;

    @Field(() => MovementType, { nullable: true })
    adjustmentType?: MovementType; // ADJUSTMENT_IN or ADJUSTMENT_OUT only

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}
