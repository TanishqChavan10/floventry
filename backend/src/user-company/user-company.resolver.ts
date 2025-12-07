import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserCompanyService } from './user-company.service';
import { UserCompany } from './user-company.model';
import { UpdateRoleInput } from './dto/update-role.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Resolver(() => UserCompany)
export class UserCompanyResolver {
  constructor(private readonly userCompanyService: UserCompanyService) { }

  @Query(() => [UserCompany])
  @UseGuards(ClerkAuthGuard)
  async usersInCompany(@Context() context: any) {
    const companyId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from context dummy UUID
    return this.userCompanyService.listUsersInCompany(companyId);
  }

  @Mutation(() => UserCompany)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateRole(
    @Args('input') input: UpdateRoleInput,
    @Context() context: any,
  ) {
    const requestingUserId = context.req.user.id;
    return this.userCompanyService.changeRole(input, requestingUserId);
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async removeUser(
    @Args('membershipId', { type: () => String }) membershipId: string,
    @Context() context: any,
  ) {
    const requestingUserId = context.req.user.id;
    await this.userCompanyService.removeUser(membershipId, requestingUserId);
    return true;
  }
}
