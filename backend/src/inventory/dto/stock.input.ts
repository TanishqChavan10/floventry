import { InputType, Field, ID, Float, Int, GraphQLISODateTime } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min, IsInt } from 'class-validator';
import { MovementType, ReferenceType } from '../entities/stock-movement.entity';
import { StockHealthStatus } from '../types/stock-health.types';

@InputType()
export class CreateStockInput {
    @Field(() => ID)
    @IsUUID()
    product_id: string;

    @Field(() => ID)
    @IsUUID()
    warehouse_id: string;

    @Field(() => Int, { defaultValue: 0 })
    @IsInt()
    @Min(0)
    quantity: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    min_stock_level?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    max_stock_level?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    reorder_point?: number;
}

@InputType()
export class CreateOpeningStockInput {
    @Field(() => ID)
    @IsUUID()
    product_id: string;

    @Field(() => ID)
    @IsUUID()
    warehouse_id: string;

    @Field(() => Int)
    @IsInt()
    @Min(0)
    quantity: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    min_stock_level?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    max_stock_level?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    reorder_point?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    note?: string;

    @Field(() => GraphQLISODateTime, { nullable: true })
    @IsOptional()
    expiry_date?: Date;
}

@InputType()
export class UpdateStockInput {
    @Field(() => ID)
    @IsUUID()
    id: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    min_stock_level?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    max_stock_level?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(0)
    reorder_point?: number;
}

@InputType()
export class AdjustStockInput {
    @Field(() => ID)
    @IsUUID()
    product_id: string;

    @Field(() => ID)
    @IsUUID()
    warehouse_id: string;

    @Field(() => Int)
    @IsInt()
    quantity: number; // Can be positive or negative

    @Field(() => MovementType)
    @IsEnum(MovementType)
    type: MovementType;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    reason?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    reference_id?: string;

    @Field(() => ReferenceType, { nullable: true })
    @IsOptional()
    @IsEnum(ReferenceType)
    reference_type?: ReferenceType;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    notes?: string;
}

@InputType()
export class StockMovementFilterInput {
    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsUUID()
    warehouse_id?: string;

    @Field(() => ID, { nullable: true })
    @IsOptional()
    @IsUUID()
    product_id?: string;

    @Field(() => MovementType, { nullable: true })
    @IsOptional()
    @IsEnum(MovementType)
    type?: MovementType;

    @Field(() => [MovementType], { nullable: true })
    @IsOptional()
    types?: MovementType[];

    @Field({ nullable: true })
    @IsOptional()
    from_date?: Date;

    @Field({ nullable: true })
    @IsOptional()
    to_date?: Date;

    @Field({ nullable: true, defaultValue: 50 })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @Field({ nullable: true, defaultValue: 0 })
    @IsOptional()
    @IsNumber()
    offset?: number;
}

@InputType()
export class CompanyInventorySummaryFilterInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    search?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    warehouseId?: string; // Optional filtering by warehouse

    @Field(() => StockHealthStatus, { nullable: true })
    @IsOptional()
    @IsEnum(StockHealthStatus)
    status?: StockHealthStatus;

    @Field({ nullable: true, defaultValue: 50 })
    @IsOptional()
    @IsNumber()
    limit?: number;

    @Field({ nullable: true, defaultValue: 0 })
    @IsOptional()
    @IsNumber()
    offset?: number;
}
