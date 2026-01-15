import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

/**
 * Stock health state enum
 * Represents the overall health of a product's inventory
 */
export enum StockHealthState {
    HEALTHY = 'HEALTHY',
    AT_RISK = 'AT_RISK',
    LOW_STOCK = 'LOW_STOCK',
    CRITICAL = 'CRITICAL',
    BLOCKED = 'BLOCKED',
}

// Register enum for GraphQL
registerEnumType(StockHealthState, {
    name: 'StockHealthState',
    description: 'Health state of stock considering expiry and availability',
});

/**
 * Warehouse-level stock health result
 */
@ObjectType()
export class WarehouseStockHealthResult {
    @Field()
    productId: string;

    @Field()
    productName: string;

    @Field()
    warehouseId: string;

    @Field()
    totalStock: number;

    @Field()
    usableStock: number;

    @Field()
    expiredQty: number;

    @Field()
    expiringSoonQty: number;

    @Field(() => StockHealthState)
    state: StockHealthState;

    @Field({ nullable: true })
    nearestExpiryDate?: Date;

    @Field({ nullable: true })
    reorderPoint?: number;

    @Field()
    recommendation: string;
}

/**
 * Company-level stock health result
 */
@ObjectType()
export class CompanyStockHealthResult {
    @Field()
    productId: string;

    @Field()
    productName: string;

    @Field()
    totalUsableStock: number;

    @Field(() => StockHealthState)
    state: StockHealthState;

    @Field(() => [String])
    affectedWarehouses: string[];

    @Field({ nullable: true })
    nearestExpiryDate?: Date;

    @Field()
    recommendation: string;
}
