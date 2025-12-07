import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserModel } from './models/user.model';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkUser } from './decorators/clerk-user.decorator';
import { ClerkService } from './clerk.service';
import { GraphQLError } from 'graphql';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private clerkService: ClerkService) {}

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
      clerk_id: user.clerk_id,
      email: user.email,
      firstName: user.full_name.split(' ')[0] || '',
      lastName: user.full_name.split(' ').slice(1).join(' ') || '',
      imageUrl: user.avatar_url,
      username: user.email, // Use email as username
      role: 'admin', // Default role
      isActive: true, // Default active
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: new Date(), // Current login time
    };
  }
}
