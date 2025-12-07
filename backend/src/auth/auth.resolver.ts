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
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
