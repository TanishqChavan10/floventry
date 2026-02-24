import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ValidateInviteResponse {
  @Field()
  email: string;

  @Field()
  companyName: string;

  @Field({ nullable: true })
  companySlug?: string;

  @Field()
  role: string;

  @Field()
  companyId: string;

  @Field()
  status: string;
}
