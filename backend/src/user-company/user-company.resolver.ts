import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserCompanyService } from './user-company.service';
import { UserCompany } from './user-company.model';
import { CompanyMemberDetails } from './dto/company-member-details';
import { WarehouseMember } from './dto/warehouse-member.dto';
import { UpdateRoleInput } from './dto/update-role.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Resolver(() => UserCompany)
export class UserCompanyResolver {
  constructor(private readonly userCompanyService: UserCompanyService) { }

  @Query(() => [UserCompany])
  @UseGuards(AuthGuard)
  async usersInCompany(@Context() context: any) {
    const companyId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from context dummy UUID
    return this.userCompanyService.listUsersInCompany(companyId);
  }

  @Query(() => [UserCompany], { name: 'myCompanies' })
  @UseGuards(AuthGuard)
  async myCompanies(@Context() context: any) {
    const userId = context.req.user.id;
    return this.userCompanyService.listForUser(userId);
  }

  @Mutation(() => UserCompany)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async updateRole(
    @Args('input') input: UpdateRoleInput,
    @Context() context: any,
  ) {
    const requestingUserId = context.req.user.id;
    const requesterRole = (context.req.user.role || '').toUpperCase();
    return this.userCompanyService.changeRole(input, requestingUserId, requesterRole);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async removeUser(
    @Args('membershipId', { type: () => String }) membershipId: string,
    @Context() context: any,
  ) {
    const requestingUserId = context.req.user.id;
    await this.userCompanyService.removeUser(membershipId, requestingUserId);
    return true;
  }

  //------------------------------------------------------------
  // NEW: Get company members with warehouse details
  //------------------------------------------------------------
  @Query(() => [CompanyMemberDetails], { name: 'companyMembers' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async getCompanyMembers(
    @Args('companyId', { type: () => String }) companyId: string,
    @Context() context: any,
  ) {
    // TODO: Add permission check if MANAGER - filter to only their warehouse users
    return this.userCompanyService.getCompanyMembersWithDetails(companyId);
  }

  //------------------------------------------------------------
  // NEW: Remove member with validation
  //------------------------------------------------------------
  @Mutation(() => Boolean, { name: 'removeMemberValidated' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async removeMemberValidated(
    @Args('membershipId', { type: () => String }) membershipId: string,
    @Context() context: any,
  ) {
    const removerId = context.req.user.id;
    const removerRole = context.req.user.role || Role.STAFF;

    await this.userCompanyService.removeMemberWithValidation(
      membershipId,
      removerId,
      removerRole,
    );

    return true;
  }

  //------------------------------------------------------------
  // NEW: Update member warehouses
  //------------------------------------------------------------
  @Mutation(() => Boolean, { name: 'updateMemberWarehouses' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateMemberWarehouses(
    @Args('membershipId', { type: () => String }) membershipId: string,
    @Args('warehouseIds', { type: () => [String] }) warehouseIds: string[],
    @Context() context: any,
  ) {
    const updaterId = context.req.user.id;
    const updaterRole = context.req.user.role || Role.STAFF;

    await this.userCompanyService.updateMemberWarehouses(
      membershipId,
      warehouseIds,
      updaterRole,
      updaterId,
    );

    return true;
  }

  //------------------------------------------------------------
  // NEW: Get warehouse members
  //------------------------------------------------------------
  @Query(() => [WarehouseMember], { name: 'warehouseMembers' })
  @UseGuards(AuthGuard)
  async getWarehouseMembers(
    @Args('warehouseId', { type: () => String }) warehouseId: string,
    @Context() context: any,
  ): Promise<WarehouseMember[]> {
    const members =
      await this.userCompanyService.getMembersByWarehouse(warehouseId);

    // Map the raw query result to WarehouseMember DTO
    return members.map((member: any) => ({
      userId: member.user_id,
      email: member.email,
      fullName: member.fullName,
      role: member.role,
      isManager: member.is_manager || false,
    }));
  }

  //------------------------------------------------------------
  // NEW: Switch default warehouse
  //------------------------------------------------------------
  @Mutation(() => Boolean, { name: 'switchWarehouse' })
  @UseGuards(AuthGuard)
  async switchWarehouse(
    @Args('warehouseId', { type: () => String }) warehouseId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user.id;
    await this.userCompanyService.setDefaultWarehouse(userId, warehouseId);
    return true;
  }
}
