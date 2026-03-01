import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { Warehouse } from './warehouse.entity';
import { UserWarehouse } from './models/user-warehouse.model';
import { CreateWarehouseInput } from './dto/create-warehouse.input';
import {
  UpdateWarehouseInput,
} from './dto/update-warehouse.input';
import { AssignUserToWarehouseInput } from './dto/assign-user-warehouse.input';
import {
  WarehouseKPIs,
  LowStockPreviewItem,
  DashboardMovementItem,
} from './dto/warehouse-dashboard.types';
import {
  StockSnapshotResult,
  StockSnapshotFilters,
  StockMovementResult,
  StockMovementFilters,
  AdjustmentResult,
  AdjustmentFilters,
} from './dto/warehouse-reports.types';
import { WarehouseHealthSummary } from '../inventory/types/company-inventory.types';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntityType } from '../audit/enums/audit.enums';
import { NotificationsService } from '../notifications/notifications.service';

@Resolver(() => Warehouse)
export class WarehouseResolver {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) { }

  @Mutation(() => Warehouse)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async createWarehouse(
    @Args('input') input: CreateWarehouseInput,
    @ClerkUser() user: any,
  ): Promise<Warehouse> {
    if (!user.activeCompanyId) {
      throw new Error('No active company');
    }

    const warehouse = await this.warehouseService.create(input, user.activeCompanyId, user.id);

    await this.auditLogService.record({
      companyId: user.activeCompanyId,
      actor: { id: user.id, email: user.email || '', role: user.role || 'OWNER' },
      action: AuditAction.WAREHOUSE_CREATED,
      entityType: AuditEntityType.WAREHOUSE,
      entityId: warehouse.id,
      metadata: { warehouseName: warehouse.name, warehouseSlug: warehouse.slug },
    });

    return warehouse;
  }

  @Mutation(() => Warehouse)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async updateWarehouse(
    @Args('id') id: string,
    @Args('input') input: UpdateWarehouseInput,
  ): Promise<Warehouse> {
    return this.warehouseService.update(id, input);
  }


  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async deleteWarehouse(
    @Args('id', { type: () => ID }) id: string,
    @ClerkUser() user: any,
  ): Promise<boolean> {
    const warehouse = await this.warehouseService.findOne(id);
    await this.warehouseService.remove(id);

    await this.auditLogService.record({
      companyId: user.activeCompanyId,
      actor: { id: user.id, email: user.email || '', role: user.role || 'ADMIN' },
      action: AuditAction.WAREHOUSE_ARCHIVED,
      entityType: AuditEntityType.WAREHOUSE,
      entityId: id,
      metadata: { warehouseName: warehouse.name },
    });

    this.notificationsService
      .notifyWarehouseArchived(user.activeCompanyId, id, warehouse.name)
      .catch((err) =>
        console.error('Failed to send warehouse-archived notification', err),
      );

    return true;
  }

  @Mutation(() => UserWarehouse)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async assignUserToWarehouse(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('input') input: AssignUserToWarehouseInput,
  ): Promise<any> {
    const assignment = await this.warehouseService.assignUser(
      warehouseId,
      input.userId,
      input.role,
    );

    return {
      id: assignment.id,
      userId: assignment.user_id,
      warehouseId: assignment.warehouse_id,
      role: assignment.role,
      isManagerOfWarehouse: assignment.is_manager_of_warehouse,
      createdAt: assignment.created_at,
    };
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async removeUserFromWarehouse(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    await this.warehouseService.removeUser(warehouseId, userId);
    return true;
  }

  @Mutation(() => Warehouse)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER) // OWNER only
  async reactivateWarehouse(
    @Args('id', { type: () => ID }) id: string,
    @ClerkUser() user: any,
  ): Promise<Warehouse> {
    const warehouse = await this.warehouseService.reactivate(id);

    await this.auditLogService.record({
      companyId: user.activeCompanyId,
      actor: { id: user.id, email: user.email || '', role: user.role || 'OWNER' },
      action: AuditAction.WAREHOUSE_REACTIVATED,
      entityType: AuditEntityType.WAREHOUSE,
      entityId: id,
      metadata: { warehouseName: warehouse.name },
    });

    return warehouse;
  }

  @Query(() => Warehouse)
  @UseGuards(ClerkAuthGuard)
  async warehouse(@Args('id') id: string): Promise<Warehouse> {
    return this.warehouseService.findOne(id);
  }

  @Query(() => [Warehouse])
  @UseGuards(ClerkAuthGuard)
  async warehouses(@ClerkUser() user: any): Promise<Warehouse[]> {
    if (!user.activeCompanyId) {
      return [];
    }
    return this.warehouseService.findAll(user.activeCompanyId);
  }

  @Query(() => WarehouseKPIs)
  @UseGuards(ClerkAuthGuard)
  async warehouseKPIs(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
  ): Promise<WarehouseKPIs> {
    return this.warehouseService.getKPIs(warehouseId);
  }

  @Query(() => [LowStockPreviewItem])
  @UseGuards(ClerkAuthGuard)
  async lowStockPreview(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    limit: number,
  ): Promise<LowStockPreviewItem[]> {
    return this.warehouseService.getLowStockPreviewWithStatus(
      warehouseId,
      limit,
    );
  }

  @Query(() => [DashboardMovementItem])
  @UseGuards(ClerkAuthGuard)
  async recentMovements(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 })
    limit: number,
  ): Promise<DashboardMovementItem[]> {
    return this.warehouseService.getRecentMovements(warehouseId, limit);
  }

  // ============================================
  // Warehouse Reports
  // ============================================

  @Query(() => StockSnapshotResult)
  @UseGuards(ClerkAuthGuard)
  async stockSnapshot(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('filters', { nullable: true }) filters?: StockSnapshotFilters,
  ): Promise<StockSnapshotResult> {
    return this.warehouseService.getStockSnapshot(warehouseId, filters || {});
  }

  @Query(() => StockMovementResult)
  @UseGuards(ClerkAuthGuard)
  async stockMovements(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('filters') filters: StockMovementFilters,
  ): Promise<StockMovementResult> {
    return this.warehouseService.getStockMovements(warehouseId, filters);
  }

  @Query(() => AdjustmentResult)
  @UseGuards(ClerkAuthGuard)
  async adjustmentReport(
    @Args('warehouseId', { type: () => ID }) warehouseId: string,
    @Args('filters') filters: AdjustmentFilters,
  ): Promise<AdjustmentResult> {
    return this.warehouseService.getAdjustmentReport(warehouseId, filters);
  }
}
