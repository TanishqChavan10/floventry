import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsPositive, IsString, MinLength, IsOptional } from 'class-validator';

export enum AdjustmentType {
    IN = 'IN',
    OUT = 'OUT',
}

@InputType()
export class CreateInventoryAdjustmentInput {
    @Field()
    @IsUUID()
    warehouse_id: string;

    @Field()
    @IsUUID()
    product_id: string;

    @Field(() => String)
    @IsEnum(AdjustmentType)
    adjustment_type: AdjustmentType;

    @Field()
    @IsPositive({ message: 'Quantity must be greater than 0' })
    quantity: number;

    @Field()
    @IsString()
    @MinLength(3, { message: 'Reason must be at least 3 characters' })
    reason: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    reference?: string;
}
