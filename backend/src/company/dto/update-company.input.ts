import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsEmail, IsUrl } from 'class-validator';

@InputType()
export class UpdateCompanyInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  industry?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString() // IsUrl can be strict
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address_line2?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  state?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  gst_number?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  legal_name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  company_type?: string;
}
