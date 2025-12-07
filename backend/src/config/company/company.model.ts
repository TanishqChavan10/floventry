import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Company {
  @Field(() => Int)
  company_id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  logo_url?: string;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  updated_at?: Date;

  @Field({ nullable: true })
  owner_id?: number;
}