import { registerEnumType } from '@nestjs/graphql';

export enum Role {
    OWNER = 'owner',
    ADMIN = 'admin',
    MANAGER = 'manager',
    WAREHOUSE_STAFF = 'warehouse_staff',
}

registerEnumType(Role, {
    name: 'Role',
    description: 'User roles in the company',
});
