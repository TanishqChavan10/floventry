import { Resolver, Query } from '@nestjs/graphql';
import { RoleService } from './role.service';
import { RolePermission } from './role.model';

@Resolver(() => RolePermission)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) { }

  @Query(() => [RolePermission])
  async roles() {
    return this.roleService.fetchRoles();
  }
}
