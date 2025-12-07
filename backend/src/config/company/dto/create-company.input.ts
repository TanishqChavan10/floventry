import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

@InputType()
export class CreateCompanyInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo_url?: string;
}