import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserModel } from './models/user.model';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkUser } from './decorators/clerk-user.decorator';
import { ClerkService } from './clerk.service';
import { GraphQLError } from 'graphql';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private clerkService: ClerkService) { }

  @Query(() => UserModel, { nullable: true })
  @UseGuards(ClerkAuthGuard)
  async me(
    @ClerkUser() clerkUser: { clerkId: string } | null,
  ): Promise<UserModel | null> {
    // If ClerkUser is null → return null (no redirect, no loop)
    if (!clerkUser?.clerkId) return null;

    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);

    // If user doesn't exist → return null (again, no loop)
    if (!user) return null;

    return {
      id: user.id,
      clerk_id: user.id,
      email: user.email,
      full_name: user.fullName,
      avatar_url: user.avatarUrl,
      activeCompanyId: user.activeCompanyId,
      companies: user.userCompanies
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
            return uw.warehouse && uw.warehouse.company_id === user.activeCompanyId;
          })
          ?.map((uw) => ({
            warehouseId: uw.warehouse_id,
            warehouseName: uw.warehouse.name,
            warehouseSlug: uw.warehouse.slug,
            isManager: uw.role === 'MANAGER',
          })) || [],
      defaultWarehouseId: user.userCompanies?.find(
        uc => uc.company_id === user.activeCompanyId
      )?.default_warehouse_id || undefined,
      preferences: user.preferences || {},
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  @Mutation(() => UserModel)
  @UseGuards(ClerkAuthGuard)
  async updatePreferences(
    @ClerkUser() clerkUser: { clerkId: string } | null,
    @Args('preferences', { type: () => String }) preferencesJson: string,
  ): Promise<UserModel> {
    if (!clerkUser?.clerkId) {
      throw new GraphQLError('Unauthorized');
    }

    const preferences = JSON.parse(preferencesJson);
    const user = await this.clerkService.updatePreferences(clerkUser.clerkId, preferences);

    return {
      id: user.id,
      clerk_id: user.id,
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
