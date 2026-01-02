import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateWarehouseInput {
    @Field()
    name: string;

    @Field({ nullable: true })
    slug?: string;

    @Field({ nullable: true })
    type?: string;

    @Field({ nullable: true })
    address?: string;

    @Field({ nullable: true })
    code?: string;

    @Field({ nullable: true })
    timezone?: string;

    @Field({ nullable: true })
    is_default?: boolean;
}
