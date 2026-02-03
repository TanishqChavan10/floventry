import { ObjectType, Field } from '@nestjs/graphql';
import { Role } from '../../auth/enums/role.enum';

@ObjectType()
export class UserDetails {
  @Field()
  email: string;

  @Field({ nullable: true })
  fullName?: string;
}

@ObjectType()
export class WarehouseAssignment {
  @Field()
  warehouseId: string;

  @Field()
  warehouseName: string;

  @Field()
  isManager: boolean;
}

@ObjectType()
export class CompanyMemberDetails {
  @Field()
  membership_id: string;

  @Field()
  user_id: string;

  @Field(() => Role)
  role: Role;

  @Field()
  joined_at: Date;

  @Field()
  status: string;

  @Field({ nullable: true })
  invited_by?: string;

  @Field(() => UserDetails)
  user: UserDetails;

  @Field(() => [WarehouseAssignment])
  warehouses: WarehouseAssignment[];
}
