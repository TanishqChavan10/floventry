import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WarehouseMember {
    @Field()
    userId: string;

    @Field()
    email: string;

    @Field({ nullable: true })
    fullName?: string;

    @Field()
    role: string;

    @Field()
    isManager: boolean;
}
