// send-invite.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEmail, IsEnum, IsArray, IsOptional, IsUUID } from 'class-validator';
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
  role: Role; // Values like "ADMIN", "MANAGER", "WAREHOUSE_STAFF"

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  warehouseIds?: string[]; // Warehouses user will have access to

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  managesWarehouseIds?: string[]; // Warehouses user will manage (MANAGER only)
}
