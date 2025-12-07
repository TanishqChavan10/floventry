import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './category.model';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { ClerkAuthGuard } from '../../auth/guards/clerk-auth.guard';
import { ClerkUser } from '../../auth/decorators/clerk-user.decorator';
import { ClerkService } from '../../auth/clerk.service';

@Resolver(() => Category)
@UseGuards(ClerkAuthGuard)
export class CategoryResolver {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly clerkService: ClerkService,
  ) { }

  @Mutation(() => Category)
  async createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.create(createCategoryInput, user.id);
  }

  @Query(() => [Category], { name: 'categories' })
  async findAllCategories(
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category[]> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.findAll(user.id);
  }

  @Query(() => [Category], { name: 'categoriesSimple' })
  async findAllCategoriesSimple(
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category[]> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.findAllSimple(user.id);
  }

  @Query(() => Category, { name: 'category' })
  async findOneCategory(
    @Args('id', { type: () => Int }) id: number,
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.findOne(id, user.id);
  }

  @Query(() => [Category], { name: 'categoriesByName' })
  async findCategoriesByName(
    @Args('name') name: string,
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category[]> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.findByName(name, user.id);
  }

  @Query(() => [Category], { name: 'searchCategories' })
  async searchCategories(
    @Args('searchTerm') searchTerm: string,
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category[]> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.searchByName(searchTerm, user.id);
  }

  @Mutation(() => Category)
  async updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<Category> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.update(
      updateCategoryInput.category_id,
      updateCategoryInput,
      user.id,
    );
  }

  @Mutation(() => Boolean)
  async removeCategory(
    @Args('id', { type: () => Int }) id: number,
    @ClerkUser() clerkUser: { clerkId: string },
  ): Promise<boolean> {
    const user = await this.clerkService.getUserByClerkId(clerkUser.clerkId);
    return await this.categoryService.remove(id, user.id);
  }

  @ResolveField(() => Int)
  async itemCount(@Parent() category: any): Promise<number> {
    if (category.products) {
      return category.products.length;
    }
    return 0;
  }
}
