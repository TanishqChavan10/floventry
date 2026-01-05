import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID, IsString, IsDateString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class SalesOrderItemInput {
    @Field()
    @IsUUID()
    @IsNotEmpty()
    product_id: string;

    @Field(() => Float)
    @Min(0.01)
    ordered_quantity: number;
}

@InputType()
export class CreateSalesOrderInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    customer_name: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsDateString()
    expected_dispatch_date?: string;

    @Field(() => [SalesOrderItemInput])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalesOrderItemInput)
    items: SalesOrderItemInput[];
}

@InputType()
export class UpdateSalesOrderInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    customer_name?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsDateString()
    expected_dispatch_date?: string;

    @Field(() => [SalesOrderItemInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SalesOrderItemInput)
    items?: SalesOrderItemInput[];
}
