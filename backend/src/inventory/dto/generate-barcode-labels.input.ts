import { InputType, Field, ID } from '@nestjs/graphql';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

@InputType()
export class GenerateBarcodeLabelsInput {
  @Field(() => [ID])
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  productIds: string[];
}
