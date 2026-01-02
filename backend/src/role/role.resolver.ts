import { Resolver, Query } from '@nestjs/graphql';
import { RoleService } from './role.service';
import { Role } from './role.model';

@Resolver(() => Role)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Query(() => [Role])
  async roles() {
    return this.roleService.fetchRoles();
  }
}
