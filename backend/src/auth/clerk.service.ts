import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { User } from './entities/user.entity';

@Injectable()
export class ClerkService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Sync Clerk user with local database
   */
  async syncUser(clerkId: string): Promise<User> {
    // 1. Fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);

    // 2. Try to find local user (PK = clerkId)
    let user = await this.userRepository.findOne({
      where: { id: clerkId },
    });

    // Data to sync (never overwrite PK)
    const userData = {
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      avatarUrl: clerkUser.imageUrl || undefined,
    };

    if (user) {
      // Update ONLY mutable fields
      Object.assign(user, userData);
      return this.userRepository.save(user);
    }

    // 3. If user does not exist → create new user
    user = this.userRepository.create({
      id: clerkId,       // PK stays Clerk ID
      ...userData,
    });

    return this.userRepository.save(user);
  }

  /**
   * Get an internal user by Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { id: clerkId },
      relations: ['userCompanies', 'userCompanies.company'],
    });

    if (!user) {
      user = await this.syncUser(clerkId);
    }

    return user;
  }

  /**
   * Update Clerk metadata (activeCompanyId, activeRole)
   */
  async updateUserMetadata(
    clerkId: string,
    metadata: { activeCompanyId?: string; activeRole?: string },
  ) {
    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Error updating Clerk metadata:', error);
    }
  }
}
