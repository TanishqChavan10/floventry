import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsUUID,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransferStatus } from '../entities/warehouse-transfer.entity';

@InputType()
export class TransferItemInput {
  @Field()
  @IsUUID()
  product_id: string;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  quantity: number;
}

@InputType()
export class CreateTransferInput {
  @Field()
  @IsUUID()
  source_warehouse_id: string;

  @Field()
  @IsUUID()
  destination_warehouse_id: string;

  @Field(() => [TransferItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => TransferItemInput)
  items: TransferItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class UpdateTransferInput {
  @Field()
  @IsUUID()
  id: string;

  @Field(() => [TransferItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemInput)
  items?: TransferItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType()
export class TransferFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  source_warehouse_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  destination_warehouse_id?: string;

  @Field(() => TransferStatus, { nullable: true })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @Field({ nullable: true })
  @IsOptional()
  from_date?: Date;

  @Field({ nullable: true })
  @IsOptional()
  to_date?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offset?: number;
}
