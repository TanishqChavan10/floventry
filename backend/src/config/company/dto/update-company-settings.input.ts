import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class UpdateCompanySettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  theme?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  auto_backup?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_users?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  storage_limit_gb?: number;
}