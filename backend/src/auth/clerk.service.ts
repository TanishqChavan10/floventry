import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { User } from './entities/user.entity';

@Injectable()
export class ClerkService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) { }

  /**
   * Sync Clerk user with local database
   * This creates or updates a user in your database based on Clerk data
   */
  async syncUser(clerkId: string): Promise<User> {
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);

    // Check if user exists in database
    let user = await this.userRepository.findOne({
      where: { id: clerkId },
    });

    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      avatarUrl: clerkUser.imageUrl || undefined,
    };

    if (user) {
      // Update existing user
      Object.assign(user, userData);
      return await this.userRepository.save(user);
    } else {
      // Create new user (including ID explicitly)
      user = this.userRepository.create(userData);
      return await this.userRepository.save(user);
    }
  }

  /**
   * Get or create user from Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { id: clerkId },
      relations: ['userCompanies', 'userCompanies.company'],
    });

    if (!user) {
      // User doesn't exist, sync from Clerk
      user = await this.syncUser(clerkId);
    }

    return user;
  }
}
