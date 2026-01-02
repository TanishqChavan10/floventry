import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateCategoryInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    name: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    description?: string;
}

@InputType()
export class UpdateCategoryInput extends CreateCategoryInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    id: string;
}
