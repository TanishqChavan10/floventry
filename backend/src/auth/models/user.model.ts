import { ObjectType, Field, ID } from '@nestjs/graphql';


@ObjectType()
export class UserWarehouseInfo {
  @Field(() => ID)
  warehouseId: string;

  @Field()
  warehouseName: string;

  @Field()
  warehouseSlug: string;

  @Field()
  isManager: boolean;
}

@ObjectType()
export class UserCompanyInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => String)
  role: string;

  @Field()
  isActive: boolean;
}

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field()
  clerk_id: string;

  @Field()
  email: string;

  @Field()
  full_name: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field({ nullable: true })
  activeCompanyId?: string;

  @Field(() => [UserCompanyInfo])
  companies: UserCompanyInfo[];

  @Field(() => [UserWarehouseInfo], { nullable: true })
  warehouses?: UserWarehouseInfo[];

  @Field({ nullable: true })
  defaultWarehouseId?: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => UserModel)
  user: UserModel;
}
