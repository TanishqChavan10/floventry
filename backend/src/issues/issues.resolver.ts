import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssueNote } from './entities/issue-note.entity';
import {
  CreateIssueNoteInput,
  UpdateIssueNoteInput,
  CreateFEFOIssueNoteInput,
} from './dto/issue-note.input';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => IssueNote)
export class IssuesResolver {
  constructor(private readonly issuesService: IssuesService) { }

  @Query(() => [IssueNote])
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async issueNotesByWarehouse(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset: number,
  ): Promise<IssueNote[]> {
    return this.issuesService.findAll(warehouseId, limit, offset);
  }

  @Query(() => [IssueNote])
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async issueNotesByCompany(
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset: number,
    @ClerkUser() user: any,
  ): Promise<IssueNote[]> {
    if (!user.activeCompanyId) {
      return [];
    }
    return this.issuesService.findAllByCompany(user.activeCompanyId, limit, offset);
  }

  @Query(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async issueNote(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<IssueNote> {
    return this.issuesService.findOne(id);
  }

  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createIssueNote(
    @Args('input') input: CreateIssueNoteInput,
    @ClerkUser() user: any,
  ): Promise<IssueNote> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }
    return this.issuesService.create(input, user.activeCompanyId);
  }

  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async createIssueNoteWithFEFO(
    @Args('input') input: CreateFEFOIssueNoteInput,
    @ClerkUser() user: any,
  ): Promise<IssueNote> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }
    return this.issuesService.createWithFEFO(input, user.activeCompanyId);
  }

  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async updateIssueNote(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateIssueNoteInput,
  ): Promise<IssueNote> {
    return this.issuesService.update(id, input);
  }

  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async postIssueNote(
    @Args('id', { type: () => ID }) id: string,
    @ClerkUser() user: any,
  ): Promise<IssueNote> {
    return this.issuesService.postIssueNote(id, user.id);
  }

  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async cancelIssueNote(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<IssueNote> {
    return this.issuesService.cancel(id);
  }
}
