import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { MovementType, ReferenceType } from '../entities/stock-movement.entity';

@InputType()
export class CreateStockInput {
    @Field(() => ID)
    @IsUUID()
    product_id: string;

    @Field(() => ID)
    @IsUUID()
    warehouse_id: string;

    @Field(() => Float, { defaultValue: 0 })
    @IsNumber()
    @Min(0)
    quantity: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    min_stock_level?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    max_stock_level?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
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

    @Field(() => Float)
    @IsNumber()
    @Min(0)
    quantity: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    min_stock_level?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    max_stock_level?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    reorder_point?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    note?: string;
}

@InputType()
export class UpdateStockInput {
    @Field(() => ID)
    @IsUUID()
    id: string;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    min_stock_level?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    @Min(0)
    max_stock_level?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
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

    @Field(() => Float)
    @IsNumber()
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
