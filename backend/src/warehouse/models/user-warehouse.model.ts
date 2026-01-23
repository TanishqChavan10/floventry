import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserWarehouse {
    @Field(() => ID)
    id: string;

    @Field(() => ID)
    userId: string;

    @Field(() => ID)
    warehouseId: string;

    @Field({ nullable: true })
    role?: string;

    @Field()
    isManagerOfWarehouse: boolean;

    @Field()
    createdAt: Date;
}
