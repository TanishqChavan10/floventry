import { Resolver, Query } from '@nestjs/graphql';
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
      warehouses: user.userWarehouses?.map((uw) => ({
        warehouseId: uw.warehouse_id,
        warehouseName: uw.warehouse.name,
        warehouseSlug: uw.warehouse.slug,
        isManager: uw.role === 'MANAGER',
      })) || [],
      defaultWarehouseId: user.userCompanies?.find(
        uc => uc.company_id === user.activeCompanyId
      )?.default_warehouse_id || undefined,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
