import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserModel } from './models/user.model';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { GraphQLError } from 'graphql';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Query(() => UserModel, { nullable: true })
  @UseGuards(AuthGuard)
  async me(
    @CurrentUser() authUser: { authId: string } | null,
  ): Promise<UserModel | null> {
    // If CurrentUser is null → return null (no redirect, no loop)
    if (!authUser?.authId) return null;

    const user = await this.authService.getUserById(authUser.authId);

    // If user doesn't exist → return null (again, no loop)
    if (!user) return null;

    return {
      id: user.id,
      auth_id: user.id,
      email: user.email,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      activeCompanyId: user.activeCompanyId,
      companies:
        user.userCompanies
          ?.filter((uc) => uc.status === 'active') // Only include active memberships
          ?.map((uc) => ({
            id: uc.company.id,
            name: uc.company.name,
            slug: uc.company.slug,
            role: uc.role,
            isActive: user.activeCompanyId === uc.company.id,
          })) || [],
      warehouses:
        user.userWarehouses
          ?.filter((uw) => {
            if (!user.activeCompanyId) return true;
            return (
              uw.warehouse && uw.warehouse.company_id === user.activeCompanyId
            );
          })
          ?.map((uw) => ({
            warehouseId: uw.warehouse_id,
            warehouseName: uw.warehouse.name,
            warehouseSlug: uw.warehouse.slug,
            isManager: uw.role === 'MANAGER',
          })) || [],
      defaultWarehouseId:
        user.userCompanies?.find((uc) => uc.company_id === user.activeCompanyId)
          ?.default_warehouse_id || undefined,
      preferences: user.preferences || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  @Mutation(() => UserModel)
  @UseGuards(AuthGuard)
  async updatePreferences(
    @CurrentUser() authUser: { authId: string } | null,
    @Args('preferences', { type: () => String }) preferencesJson: string,
  ): Promise<UserModel> {
    if (!authUser?.authId) {
      throw new GraphQLError('Unauthorized');
    }

    const preferences = JSON.parse(preferencesJson);
    const user = await this.authService.updatePreferences(
      authUser.authId,
      preferences,
    );

    return {
      id: user.id,
      auth_id: user.id,
      email: user.email,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      activeCompanyId: user.activeCompanyId,
      companies: [],
      warehouses: [],
      preferences: user.preferences || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
