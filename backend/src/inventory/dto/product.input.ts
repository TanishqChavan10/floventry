import { InputType, Field, Float } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateProductInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    name: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    sku: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    barcode?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    alternate_barcodes?: string[];

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    category_id?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    supplier_id?: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    unit: string;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    cost_price?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    selling_price?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    image_url?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;
}

@InputType()
export class UpdateProductInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    id: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    name?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    sku?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    barcode?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    alternate_barcodes?: string[];

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    category_id?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    supplier_id?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    unit?: string;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    cost_price?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    selling_price?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    image_url?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
