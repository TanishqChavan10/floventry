import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserCompany } from './user-company.entity';
import { UpdateRoleInput } from './dto/update-role.input';
import { AuthService } from '../auth/auth.service';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntityType } from '../audit/enums/audit.enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UserCompanyService {
  constructor(
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(UserWarehouse)
    private userWarehouseRepository: Repository<UserWarehouse>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    private authService: AuthService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listUsersInCompany(companyId: string): Promise<UserCompany[]> {
    return this.userCompanyRepository.find({
      where: { company_id: companyId, status: 'active' },
      order: { joined_at: 'ASC' },
    });
  }

  async changeRole(
    input: UpdateRoleInput,
    requestingUserId: string,
    requesterRole: string = 'ADMIN',
  ): Promise<UserCompany> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: input.membership_id },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Verify requesting user has permission (is owner or admin)
    const requestingMembership = await this.userCompanyRepository.findOne({
      where: { user_id: requestingUserId, company_id: membership.company_id },
    });

    if (!requestingMembership) {
      throw new BadRequestException(
        'Requesting user is not a member of this company',
      );
    }

    // ── Admin RBAC restrictions ──────────────────────────────────────
    const hierarchy: Record<string, number> = {
      STAFF: 1,
      MANAGER: 2,
      ADMIN: 3,
      OWNER: 4,
    };
    const requesterLevel = hierarchy[requesterRole] ?? 0;
    const targetCurrentLevel = hierarchy[membership.role] ?? 0;
    const targetNewLevel = hierarchy[input.role] ?? 0;

    // Rule 1: Admin cannot assign OWNER role (transfer ownership)
    if (input.role === 'OWNER' && requesterRole !== 'OWNER') {
      throw new BadRequestException(
        'Only the Owner can transfer ownership to another user',
      );
    }

    // Rule 2: Admin cannot change the role of an existing Owner (demote Owner)
    if (membership.role === 'OWNER' && requesterRole !== 'OWNER') {
      throw new BadRequestException(
        "Only the Owner can change another Owner's role",
      );
    }

    // Rule 3: Can only assign roles strictly below your own level
    if (targetNewLevel >= requesterLevel) {
      throw new BadRequestException(
        'You cannot assign a role equal to or higher than your own',
      );
    }
    // ────────────────────────────────────────────────────────────────

    const oldRole = membership.role;
    membership.role = input.role;
    const saved = await this.userCompanyRepository.save(membership);

    // Get requester email for audit
    const requester = await this.userCompanyRepository.findOne({
      where: { user_id: requestingUserId, company_id: membership.company_id },
    });

    await this.auditLogService.record({
      companyId: membership.company_id,
      actor: {
        id: requestingUserId,
        email: requester?.user_id || '',
        role: requester?.role || 'ADMIN',
      },
      action: AuditAction.ROLE_CHANGED,
      entityType: AuditEntityType.USER,
      entityId: membership.user_id,
      metadata: {
        targetUserId: membership.user_id,
        oldRole,
        newRole: input.role,
      },
    });

    this.notificationsService
      .notifyRoleChanged(
        membership.company_id,
        membership.user_id,
        oldRole,
        input.role,
      )
      .catch((err) =>
        console.error('Failed to send role-changed notification', err),
      );

    return saved;
  }

  async removeUser(
    membershipId: string,
    requestingUserId: string,
  ): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Verify requesting user has permission
    const requestingMembership = await this.userCompanyRepository.findOne({
      where: { user_id: requestingUserId, company_id: membership.company_id },
    });

    if (!requestingMembership) {
      throw new BadRequestException(
        'Requesting user is not a member of this company',
      );
    }

    // Cannot remove yourself
    if (membership.user_id === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself from the company');
    }

    membership.status = 'inactive';
    await this.userCompanyRepository.save(membership);

    // Get requester info for audit
    const requester = await this.userCompanyRepository.findOne({
      where: { user_id: requestingUserId, company_id: membership.company_id },
    });

    await this.auditLogService.record({
      companyId: membership.company_id,
      actor: {
        id: requestingUserId,
        email: requester?.user_id || '',
        role: requester?.role || 'ADMIN',
      },
      action: AuditAction.USER_REMOVED,
      entityType: AuditEntityType.USER,
      entityId: membership.user_id,
      metadata: {
        removedUserId: membership.user_id,
        removedUserRole: membership.role,
      },
    });

    this.notificationsService
      .notifyUserRemoved(
        membership.company_id,
        membership.user_id,
        membership.role,
      )
      .catch((err) =>
        console.error('Failed to send user-removed notification', err),
      );
  }

  async getMembership(
    userId: string,
    companyId: string,
  ): Promise<UserCompany | null> {
    return this.userCompanyRepository.findOne({
      where: { user_id: userId, company_id: companyId, status: 'active' },
      relations: ['company'],
    });
  }

  async listForUser(userId: string): Promise<any[]> {
    const userCompanies = await this.userCompanyRepository.find({
      where: { user_id: userId },
      relations: ['company'],
      order: { joined_at: 'DESC' },
    });

    return Promise.all(
      userCompanies.map(async (uc) => {
        let warehouseCount: number;

        // OWNER and ADMIN have implicit access to all warehouses
        const role = (uc.role || '').toUpperCase();
        if (role === 'OWNER' || role === 'ADMIN') {
          // Count all warehouses in this company
          warehouseCount = await this.warehouseRepository.count({
            where: { company_id: uc.company_id },
          });
        } else {
          // For MANAGER and STAFF, count only explicit assignments
          warehouseCount = await this.userWarehouseRepository
            .createQueryBuilder('uw')
            .leftJoin('uw.warehouse', 'w')
            .where('uw.user_id = :userId', { userId })
            .andWhere('w.company_id = :companyId', { companyId: uc.company_id })
            .getCount();
        }

        return {
          ...uc,
          warehouseCount,
        };
      }),
    );
  }

  private async getManagedWarehouseIdsForUserInCompany(
    userId: string,
    companyId: string,
  ): Promise<string[]> {
    const userWarehouses = await this.userWarehouseRepository.find({
      where: { user_id: userId, is_manager_of_warehouse: true },
    });

    const candidateIds = userWarehouses.map((uw) => uw.warehouse_id);
    if (candidateIds.length === 0) return [];

    const warehousesInCompany = await this.warehouseRepository.find({
      where: { id: In(candidateIds), company_id: companyId },
      select: ['id'],
    });

    return warehousesInCompany.map((w) => w.id);
  }

  //------------------------------------------------------------
  // NEW: Get company members with warehouse details
  //------------------------------------------------------------
  async getCompanyMembersWithDetails(companyId: string) {
    const rawMembers = await this.userCompanyRepository
      .createQueryBuilder('uc')
      .leftJoin('uc.user', 'user')
      .leftJoin('user_warehouses', 'uw', 'uw.user_id = uc.user_id')
      .leftJoin(
        'warehouses',
        'w',
        'w.id = uw.warehouse_id AND w.company_id = :companyId',
        { companyId },
      )
      .where('uc.company_id = :companyId', { companyId })
      .andWhere('uc.status = :status', { status: 'active' })
      .select('uc.membership_id', 'membership_id')
      .addSelect('uc.user_id', 'user_id')
      .addSelect('uc.role', 'role')
      .addSelect('uc.joined_at', 'joined_at')
      .addSelect('uc.status', 'status')
      .addSelect('uc.invited_by', 'invited_by')
      .addSelect('user.email', 'email')
      .addSelect('user.fullName', 'fullName')
      .addSelect(
        "JSON_AGG(JSON_BUILD_OBJECT('warehouseId', w.id, 'warehouseName', w.name, 'isManager', uw.is_manager_of_warehouse)) FILTER (WHERE w.id IS NOT NULL)",
        'warehouses',
      )
      .groupBy('uc.membership_id')
      .addGroupBy('uc.user_id')
      .addGroupBy('uc.role')
      .addGroupBy('uc.joined_at')
      .addGroupBy('uc.status')
      .addGroupBy('uc.invited_by')
      .addGroupBy('user.email')
      .addGroupBy('user.fullName')
      .getRawMany();

    // Map raw results to proper structure
    return rawMembers.map((raw) => ({
      membership_id: raw.membership_id,
      user_id: raw.user_id,
      role: raw.role,
      joined_at: raw.joined_at,
      status: raw.status,
      invited_by: raw.invited_by,
      user: {
        email: raw.email,
        fullName: raw.fullName,
      },
      warehouses: raw.warehouses || [],
    }));
  }

  //------------------------------------------------------------
  // NEW: Update member warehouses (MANAGER-scoped permissions)
  //------------------------------------------------------------
  async updateMemberWarehouses(
    membershipId: string,
    warehouseIds: string[],
    updaterRole: string,
    updaterId: string,
  ): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (!warehouseIds || warehouseIds.length === 0) {
      throw new BadRequestException('At least one warehouse must be selected');
    }

    const companyId = membership.company_id;

    // Validate that all requested warehouses belong to the member's company
    const warehouseCount = await this.warehouseRepository.count({
      where: { id: In(warehouseIds), company_id: companyId },
    });
    if (warehouseCount !== warehouseIds.length) {
      throw new BadRequestException(
        'One or more warehouses are invalid for this company',
      );
    }

    // Permission validation: Check if updater can modify this member's warehouses
    // OWNER and ADMIN can modify both MANAGER and STAFF
    // MANAGER can only modify STAFF
    if (updaterRole === 'OWNER' || updaterRole === 'ADMIN') {
      // OWNER and ADMIN can modify MANAGER and STAFF
      if (membership.role !== 'MANAGER' && membership.role !== 'STAFF') {
        throw new BadRequestException(
          'Can only modify warehouse assignments for MANAGER and STAFF members',
        );
      }
    } else if (updaterRole === 'MANAGER') {
      // MANAGER can only modify STAFF
      if (membership.role !== 'STAFF') {
        throw new BadRequestException(
          'Managers can only modify warehouse assignments for STAFF members',
        );
      }

      const managedWarehouseIds =
        await this.getManagedWarehouseIdsForUserInCompany(updaterId, companyId);
      if (managedWarehouseIds.length === 0) {
        throw new BadRequestException(
          'You do not manage any warehouses in this company',
        );
      }

      const invalidTargets = warehouseIds.filter(
        (id) => !managedWarehouseIds.includes(id),
      );
      if (invalidTargets.length > 0) {
        throw new BadRequestException(
          'Managers can only assign staff to warehouses they manage',
        );
      }
    } else {
      throw new BadRequestException(
        'Insufficient permissions to modify warehouse assignments',
      );
    }

    // Apply updates with correct scope:
    // - OWNER/ADMIN: replace all assignments for this user within this company
    // - MANAGER: only replace assignments within the manager's managed warehouses
    if (updaterRole === 'MANAGER') {
      const managedWarehouseIds =
        await this.getManagedWarehouseIdsForUserInCompany(updaterId, companyId);

      await this.userWarehouseRepository.delete({
        user_id: membership.user_id,
        warehouse_id: In(managedWarehouseIds),
      });
    } else {
      // Delete assignments within this company only (avoid affecting other companies)
      await this.userWarehouseRepository
        .createQueryBuilder()
        .delete()
        .from(UserWarehouse)
        .where('user_id = :userId', { userId: membership.user_id })
        .andWhere(
          'warehouse_id IN (SELECT id FROM warehouses WHERE company_id = :companyId)',
          { companyId },
        )
        .execute();
    }

    const assignments = warehouseIds.map((warehouseId) =>
      this.userWarehouseRepository.create({
        user_id: membership.user_id,
        warehouse_id: warehouseId,
        role: membership.role,
        is_manager_of_warehouse: membership.role === 'MANAGER',
      }),
    );

    await this.userWarehouseRepository.save(assignments);
  }

  //------------------------------------------------------------
  // NEW: Remove member with permission checks
  //------------------------------------------------------------
  async removeMemberWithValidation(
    membershipId: string,
    removerId: string,
    removerRole: string,
  ): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove yourself
    if (membership.user_id === removerId) {
      throw new BadRequestException('Cannot remove yourself from the company');
    }

    // Role hierarchy check
    const hierarchy = { STAFF: 1, MANAGER: 2, ADMIN: 3, OWNER: 4 };
    const removerLevel = hierarchy[removerRole] || 0;
    const targetLevel = hierarchy[membership.role] || 0;

    if (removerLevel <= targetLevel) {
      throw new BadRequestException(
        'Insufficient permissions to remove this member',
      );
    }

    // MANAGER can only remove STAFF
    if (removerRole === 'MANAGER' && membership.role !== 'STAFF') {
      throw new BadRequestException('Managers can only remove STAFF members');
    }

    // MANAGER scope: can only remove STAFF assigned to warehouses they manage
    if (removerRole === 'MANAGER') {
      const managedWarehouseIds =
        await this.getManagedWarehouseIdsForUserInCompany(
          removerId,
          membership.company_id,
        );
      if (managedWarehouseIds.length === 0) {
        throw new BadRequestException(
          'You do not manage any warehouses in this company',
        );
      }

      const overlapCount = await this.userWarehouseRepository.count({
        where: {
          user_id: membership.user_id,
          warehouse_id: In(managedWarehouseIds),
        },
      });

      if (overlapCount === 0) {
        throw new BadRequestException(
          'You can only remove staff assigned to warehouses you manage',
        );
      }
    }

    // Set status to inactive
    membership.status = 'inactive';
    await this.userCompanyRepository.save(membership);

    // Remove warehouse assignments for this user within this company
    await this.userWarehouseRepository
      .createQueryBuilder()
      .delete()
      .from(UserWarehouse)
      .where('user_id = :userId', { userId: membership.user_id })
      .andWhere(
        'warehouse_id IN (SELECT id FROM warehouses WHERE company_id = :companyId)',
        { companyId: membership.company_id },
      )
      .execute();

    // CRITICAL: Clear Supabase metadata to revoke access immediately
    // If this was their active company, they'll need to switch companies on next request
    try {
      await this.authService.updateUserMetadata(membership.user_id, {
        activeCompanyId: undefined,
        activeRole: undefined,
      });
    } catch (error) {
      console.error(
        'Failed to clear Supabase metadata for removed user:',
        error,
      );
      // Don't throw - member is already marked inactive in DB
    }
  }

  //------------------------------------------------------------
  // NEW: Get members by warehouse (for warehouse settings page)
  //------------------------------------------------------------
  async getMembersByWarehouse(warehouseId: string) {
    // This will retrieve users who have access to this warehouse
    // Including OWNER and ADMIN who have implicit access to all warehouses
    const query = `
      SELECT 
        uc.user_id,
        uc.role,
        COALESCE(uw.is_manager_of_warehouse, false) as is_manager
      FROM user_companies uc
      LEFT JOIN user_warehouses uw ON uw.user_id = uc.user_id AND uw.warehouse_id = $1
      JOIN warehouses w ON w.company_id = uc.company_id
      WHERE w.id = $1
        AND uc.status = 'active'
        AND (
          uc.role IN ('OWNER', 'ADMIN')
          OR uw.warehouse_id IS NOT NULL
        )
      ORDER BY uc.role DESC
    `;

    const result = await this.userCompanyRepository.query(query, [warehouseId]);

    // Enrich with user data from local DB (synced from Supabase Auth)
    const enrichedMembers = await Promise.all(
      result.map(async (member: any) => {
        try {
          const user = await this.authService.getUserById(member.user_id);
          return {
            user_id: member.user_id,
            email: user?.email || '',
            fullName: user?.fullName || null,
            role: member.role,
            is_manager: member.is_manager,
          };
        } catch (error) {
          console.error(`Failed to fetch user ${member.user_id}:`, error);
          return {
            user_id: member.user_id,
            email: 'Unknown',
            fullName: null,
            role: member.role,
            is_manager: member.is_manager,
          };
        }
      }),
    );

    return enrichedMembers;
  }

  //------------------------------------------------------------
  // NEW: Set default warehouse for user
  //------------------------------------------------------------
  async setDefaultWarehouse(
    userId: string,
    warehouseId: string,
  ): Promise<void> {
    // Get user's active company (stored in DB)
    const user = await this.authService.getUserById(userId);

    if (!user || !user.activeCompanyId) {
      throw new BadRequestException('User does not have an active company');
    }

    const activeCompanyId = user.activeCompanyId;

    // Ensure membership exists
    const membership = await this.userCompanyRepository.findOne({
      where: { user_id: userId, company_id: activeCompanyId, status: 'active' },
    });
    if (!membership) {
      throw new BadRequestException(
        'User is not a member of the active company',
      );
    }

    // Ensure warehouse exists and belongs to active company
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: warehouseId, company_id: activeCompanyId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found in active company');
    }

    // Ensure user has access to warehouse (OWNER/ADMIN have implicit access)
    const role = (membership.role || '').toUpperCase();
    const isPrivileged = role === 'OWNER' || role === 'ADMIN';

    if (!isPrivileged) {
      const assignment = await this.userWarehouseRepository.findOne({
        where: { user_id: userId, warehouse_id: warehouseId },
      });
      if (!assignment) {
        throw new BadRequestException(
          'User does not have access to this warehouse',
        );
      }
    }

    const result = await this.userCompanyRepository.update(
      { user_id: userId, company_id: activeCompanyId },
      { default_warehouse_id: warehouseId },
    );

    if (!result.affected) {
      throw new BadRequestException('Failed to update default warehouse');
    }
  }
}
