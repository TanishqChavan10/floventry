import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

@InputType()
export class SendInviteInput {
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field(() => Role)
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}