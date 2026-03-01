import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from './entities/user.entity';

/**
 * Auth service — handles user authentication and sync via Supabase Auth.
 */
@Injectable()
export class AuthService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  /**
   * Sync Supabase Auth user with local database.
   * @param supabaseUserId – The Supabase Auth UUID (from JWT `sub`).
   */
  async syncUser(supabaseUserId: string): Promise<User> {
    // 1. Fetch user from Supabase Auth (admin)
    const { data: authUser, error } =
      await this.supabaseAdmin.auth.admin.getUserById(supabaseUserId);

    if (error || !authUser?.user) {
      throw new Error(`Failed to fetch Supabase user: ${error?.message}`);
    }

    const sbUser = authUser.user;

    // 2. Try to find local user
    let user = await this.userRepository.findOne({
      where: { id: supabaseUserId },
    });

    // Data to sync (never overwrite PK)
    const userData = {
      email: sbUser.email || '',
      fullName:
        (sbUser.user_metadata?.full_name as string) ||
        (sbUser.user_metadata?.name as string) ||
        `${sbUser.user_metadata?.first_name || ''} ${sbUser.user_metadata?.last_name || ''}`.trim() ||
        '',
      avatarUrl:
        (sbUser.user_metadata?.avatar_url as string) ||
        (sbUser.user_metadata?.picture as string) ||
        undefined,
    };

    if (user) {
      // Update ONLY mutable fields
      Object.assign(user, userData);
      return this.userRepository.save(user);
    }

    // 3. If user does not exist → create new user
    user = this.userRepository.create({
      id: supabaseUserId, // PK = Supabase Auth UUID
      ...userData,
    });

    return this.userRepository.save(user);
  }

  /**
   * Get an internal user by their auth ID (with relations).
   */
  async getUserById(userId: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'userCompanies',
        'userCompanies.company',
        'userWarehouses',
        'userWarehouses.warehouse',
      ],
    });

    if (!user) {
      await this.syncUser(userId);
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: [
          'userCompanies',
          'userCompanies.company',
          'userWarehouses',
          'userWarehouses.warehouse',
        ],
      });
      if (!user) {
        throw new Error('Failed to find user after sync');
      }
    }

    return user;
  }

  /**
   * Update user metadata.
   * Stores in Supabase Auth user_metadata AND local database.
   */
  async updateUserMetadata(
    userId: string,
    metadata: { activeCompanyId?: string; activeRole?: string },
  ) {
    try {
      // Update Supabase Auth user metadata
      await this.supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadata,
      });

      // Also update the local database if activeCompanyId is provided
      if (metadata.activeCompanyId !== undefined) {
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });

        if (user) {
          user.activeCompanyId = metadata.activeCompanyId;
          await this.userRepository.save(user);
        }
      }
    } catch (error) {
      console.error('Error updating user metadata:', error);
    }
  }

  /**
   * Update user preferences in the database.
   */
  async updatePreferences(userId: string, preferences: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.preferences = preferences;
    return this.userRepository.save(user);
  }

  /**
   * Get the Supabase Auth user (email, metadata, etc.)
   * Used by the guard to fetch additional user info.
   */
  async getSupabaseAuthUser(userId: string) {
    const { data, error } =
      await this.supabaseAdmin.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user;
  }
}
