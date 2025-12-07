import { ObjectType, Field } from '@nestjs/graphql';
import { Role } from '../auth/enums/role.enum';

@ObjectType()
export class UserCompany {
  @Field(() => String)
  membership_id: string;

  @Field(() => String)
  user_id: string;

  @Field(() => String)
  company_id: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field()
  joined_at: Date;

  @Field(() => String, { nullable: true })
  invited_by?: string;

  @Field({ nullable: true })
  status?: string; // active, pending, inactive
}