import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString } from 'class-validator';

@InputType()
export class AssignUserToWarehouseInput {
    @Field(() => ID)
    @IsUUID()
    userId: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    role?: string;
}
