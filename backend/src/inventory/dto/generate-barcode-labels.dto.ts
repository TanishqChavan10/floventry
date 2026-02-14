import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { BarcodeLabelLayout } from './generate-barcode-labels.input';

export class GenerateBarcodeLabelsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds!: string[];

  @IsOptional()
  @IsEnum(BarcodeLabelLayout)
  layout?: BarcodeLabelLayout;
}
