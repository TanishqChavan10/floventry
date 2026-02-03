import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { GlobalSearchResponse } from './global-search.types';
import { GlobalSearchService } from './global-search.service';

type ClerkRequestUser = {
  id?: string;
  userId?: string;
  activeCompanyId?: string;
  role?: string;
} | null;

@Resolver()
export class GlobalSearchResolver {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Query(() => GlobalSearchResponse, { name: 'globalSearch' })
  @UseGuards(ClerkAuthGuard)
  async globalSearch(
    @Args('query') query: string,
    @ClerkUser() user: ClerkRequestUser,
  ): Promise<GlobalSearchResponse> {
    if (!user?.activeCompanyId) {
      // Keep behavior silent (no leak) and consistent with other resolvers.
      return { products: [], warehouses: [], documents: [] };
    }

    const userId = user.userId ?? user.id;
    if (!userId) {
      return { products: [], warehouses: [], documents: [] };
    }

    const normalized = (query ?? '').trim();
    if (normalized.length > 0 && normalized.length < 2) {
      return { products: [], warehouses: [], documents: [] };
    }

    if (!normalized) {
      throw new BadRequestException('Query is required');
    }

    return this.globalSearchService.globalSearch({
      query: normalized,
      companyId: user.activeCompanyId,
      userId,
      role: user.role,
    });
  }
}
