import { InputType, Field, ID, Float } from '@nestjs/graphql';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

@InputType()
export class PurchaseOrderItemInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  ordered_quantity: number;
}

@InputType()
export class CreatePurchaseOrderInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  supplier_id: string;

  @Field(() => [PurchaseOrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemInput)
  items: PurchaseOrderItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdatePurchaseOrderInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @Field(() => [PurchaseOrderItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemInput)
  items?: PurchaseOrderItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class PurchaseOrderFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @Field(() => PurchaseOrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

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
