import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';

@InputType()
export class UpdateCompanySettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  low_stock_threshold?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  expiry_warning_days?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enable_expiry_tracking?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  stock_valuation_method?: string;

  // Access
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  restrict_manager_catalog?: boolean;
}
