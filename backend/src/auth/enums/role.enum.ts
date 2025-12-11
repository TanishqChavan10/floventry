import { registerEnumType } from '@nestjs/graphql';

export enum Role {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
}

registerEnumType(Role, {
    name: 'Role',
    description: 'User roles in the company',
});
