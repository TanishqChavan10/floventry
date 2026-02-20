import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
    @Field(() => Int, { nullable: true, defaultValue: 1 })
    page?: number;

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    limit?: number;

    @Field({ nullable: true })
    search?: string;
}

@ObjectType()
export class PageInfo {
    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field()
    hasNextPage: boolean;

    @Field()
    hasPreviousPage: boolean;
}
