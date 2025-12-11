import { ObjectType, Field, ID } from '@nestjs/graphql';

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
}

@ObjectType()
export class SwitchCompanyResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  activeCompanyId?: string;
}