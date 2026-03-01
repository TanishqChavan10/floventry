import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GlobalSearchResponse } from './global-search.types';
import { GlobalSearchService } from './global-search.service';

type SupabaseRequestUser = {
  id?: string;
  userId?: string;
  activeCompanyId?: string;
  role?: string;
} | null;

@Resolver()
export class GlobalSearchResolver {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Query(() => GlobalSearchResponse, { name: 'globalSearch' })
  @UseGuards(AuthGuard)
  async globalSearch(
    @Args('query') query: string,
    @CurrentUser() user: SupabaseRequestUser,
  ): Promise<GlobalSearchResponse> {
    const emptyResponse = {
      products: [],
      warehouses: [],
      documents: [],
      suppliers: [],
      categories: [],
      purchaseOrders: [],
      salesOrders: [],
    };

    if (!user?.activeCompanyId) {
      // Keep behavior silent (no leak) and consistent with other resolvers.
      return emptyResponse;
    }

    const userId = user.userId ?? user.id;
    if (!userId) {
      return emptyResponse;
    }

    const normalized = (query ?? '').trim();
    if (normalized.length > 0 && normalized.length < 2) {
      return emptyResponse;
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
