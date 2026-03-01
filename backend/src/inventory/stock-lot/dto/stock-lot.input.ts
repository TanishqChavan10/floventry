import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LotSourceType } from '../entities/stock-lot.entity';

@InputType()
export class CreateStockLotInput {
  @Field()
  @IsUUID()
  company_id: string;

  @Field()
  @IsUUID()
  warehouse_id: string;

  @Field()
  @IsUUID()
  product_id: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiry_date?: Date;

  @Field()
  @IsDate()
  @Type(() => Date)
  received_at: Date;

  @Field(() => LotSourceType)
  @IsEnum(LotSourceType)
  source_type: LotSourceType;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  source_id?: string;
}

@InputType()
export class UpdateStockLotQuantityInput {
  @Field()
  @IsUUID()
  lot_id: string;

  @Field(() => Int)
  @IsInt()
  quantity_delta: number; // Can be positive or negative
}

@InputType()
export class StockLotFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  expiry_status?: string; // OK, EXPIRING_SOON, EXPIRED

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
