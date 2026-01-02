import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class AcceptInviteInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  token: string;
}