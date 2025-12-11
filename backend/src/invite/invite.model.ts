// invite.model.ts
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class Invite {
  @Field(() => String)
  invite_id: string;

  @Field()
  email: string;

  @Field(() => String)
  company_id: string;

  @Field(() => String)
  role: string; // Use string to avoid enum mismatch

  @Field(() => String)
  invited_by: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  token?: string;

  @Field()
  expires_at: Date;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  accepted_at?: Date;
}
