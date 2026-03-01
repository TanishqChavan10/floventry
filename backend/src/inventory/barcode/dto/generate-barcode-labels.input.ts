import { InputType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export enum BarcodeLabelLayout {
  A4_SINGLE = 'A4_SINGLE',
  A4_2X4 = 'A4_2X4',
  A4_3X8 = 'A4_3X8',
  THERMAL_50X25 = 'THERMAL_50X25',
}

registerEnumType(BarcodeLabelLayout, {
  name: 'BarcodeLabelLayout',
});

@InputType()
export class GenerateBarcodeLabelsInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds: string[];

  @Field(() => BarcodeLabelLayout, { nullable: true })
  layout?: BarcodeLabelLayout;
}
