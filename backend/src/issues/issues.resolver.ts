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
import { WarehouseGuard } from '../auth/guards/warehouse.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver(() => IssueNote)
export class IssuesResolver {
  constructor(private readonly issuesService: IssuesService) { }

  // Warehouse-scoped: Staff allowed (WarehouseGuard enforces assignment)
  @Query(() => [IssueNote])
  @UseGuards(ClerkAuthGuard, RolesGuard, WarehouseGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async issueNotesByWarehouse(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset: number,
  ): Promise<IssueNote[]> {
    return this.issuesService.findAll(warehouseId, limit, offset);
  }

  // Company-wide view: OWNER and ADMIN only (cross-warehouse aggregation)
  @Query(() => [IssueNote])
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
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
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async issueNote(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<IssueNote> {
    return this.issuesService.findOne(id);
  }

  // Staff can create draft issue notes — WarehouseGuard checks input.warehouse_id
  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard, WarehouseGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async createIssueNote(
    @Args('input') input: CreateIssueNoteInput,
    @ClerkUser() user: any,
  ): Promise<IssueNote> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }
    return this.issuesService.create(input, user.activeCompanyId);
  }

  // Staff can create FEFO draft issue notes
  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard, WarehouseGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async createIssueNoteWithFEFO(
    @Args('input') input: CreateFEFOIssueNoteInput,
    @ClerkUser() user: any,
  ): Promise<IssueNote> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }
    return this.issuesService.createWithFEFO(input, user.activeCompanyId);
  }

  // Staff can edit draft issue notes
  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateIssueNote(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateIssueNoteInput,
  ): Promise<IssueNote> {
    return this.issuesService.update(id, input);
  }

  // Post: MANAGER+ only — staff cannot post
  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async postIssueNote(
    @Args('id', { type: () => ID }) id: string,
    @ClerkUser() user: any,
  ): Promise<IssueNote> {
    return this.issuesService.postIssueNote(id, user.id);
  }

  // Cancel posted issue: OWNER and ADMIN only
  @Mutation(() => IssueNote)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async cancelIssueNote(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<IssueNote> {
    return this.issuesService.cancel(id);
  }
}
