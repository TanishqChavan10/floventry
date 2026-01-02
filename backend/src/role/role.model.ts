import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Role {
  @Field(() => Int)
  role_id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  permissions: string[];

  @Field({ nullable: true })
  color?: string;

  @Field()
  is_default: boolean;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  updated_at?: Date;
}