import { ObjectType, Field } from '@nestjs/graphql';
import { Role } from '../auth/enums/role.enum';

@ObjectType()
export class Invite {
  @Field(() => String)
  invite_id: string;

  @Field()
  email: string;

  @Field(() => String)
  company_id: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => String)
  invited_by: string;

  @Field()
  status: string; // pending, accepted, rejected, expired

  @Field({ nullable: true })
  token?: string;

  @Field()
  expires_at: Date;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  accepted_at?: Date;
}