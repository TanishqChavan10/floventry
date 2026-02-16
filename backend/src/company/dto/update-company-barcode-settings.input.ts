import { InputType, Field, Int, Float } from '@nestjs/graphql';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class UpdateCompanyBarcodeSettingsInput {
  @Field(() => String)
  @IsString()
  @MaxLength(20)
  @Matches(/^\S*$/, { message: 'barcodePrefix cannot contain spaces' })
  barcodePrefix: string;

  @Field(() => Int)
  @IsInt()
  @Min(3)
  @Max(10)
  barcodePadding: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  barcodeNextNumber?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  barcodeSuffix?: string;
}
