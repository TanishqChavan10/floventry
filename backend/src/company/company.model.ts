import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CompanySettings } from './company-settings.model';
import { Warehouse } from '../warehouse/warehouse.entity';

@ObjectType()
export class Company {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo_url?: string;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  updated_at?: Date;

  @Field({ nullable: true })
  created_by?: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  company_type?: string;

  @Field({ nullable: true })
  legal_name?: string;

  @Field({ nullable: true })
  address_line1?: string;

  @Field({ nullable: true })
  address_line2?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  gst_number?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  industry?: string;

  @Field(() => CompanySettings, { nullable: true })
  settings?: CompanySettings;

  @Field(() => [Warehouse], { nullable: true })
  warehouses?: Warehouse[];
}

@ObjectType()
export class SwitchCompanyResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  activeCompanyId?: string;
}
