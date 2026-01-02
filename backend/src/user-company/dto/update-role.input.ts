import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

@InputType()
export class UpdateRoleInput {
  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  membership_id: string;

  @Field(() => Role)
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}