import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCompany } from './user-company.entity';
import { UpdateRoleInput } from './dto/update-role.input';
import { ClerkService } from '../auth/clerk.service';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';

@Injectable()
export class UserCompanyService {
  constructor(
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(UserWarehouse)
    private userWarehouseRepository: Repository<UserWarehouse>,
    private clerkService: ClerkService,
  ) { }

  async listUsersInCompany(companyId: string): Promise<UserCompany[]> {
    return this.userCompanyRepository.find({
      where: { company_id: companyId, status: 'active' },
      order: { joined_at: 'ASC' },
    });
  }

  async changeRole(input: UpdateRoleInput, requestingUserId: string): Promise<UserCompany> {
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
      throw new BadRequestException('Requesting user is not a member of this company');
    }

    // TODO: Permission check: Ensure requester has higher role than target, and can assign target role.

    membership.role = input.role;
    return this.userCompanyRepository.save(membership);
  }

  async removeUser(membershipId: string, requestingUserId: string): Promise<void> {
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
      throw new BadRequestException('Requesting user is not a member of this company');
    }

    // Cannot remove yourself
    if (membership.user_id === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself from the company');
    }

    membership.status = 'inactive';
    await this.userCompanyRepository.save(membership);
  }

  async getMembership(userId: string, companyId: string): Promise<UserCompany | null> {
    return this.userCompanyRepository.findOne({
      where: { user_id: userId, company_id: companyId, status: 'active' },
      relations: ['company'],
    });
  }

  //------------------------------------------------------------
  // NEW: Get company members with warehouse details
  //------------------------------------------------------------
  async getCompanyMembersWithDetails(companyId: string) {
    const rawMembers = await this.userCompanyRepository
      .createQueryBuilder('uc')
      .leftJoin('uc.user', 'user')
      .leftJoin('user_warehouses', 'uw', 'uw.user_id = uc.user_id')
      .leftJoin('warehouses', 'w', 'w.id = uw.warehouse_id AND w.company_id = :companyId', { companyId })
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
      .addSelect('JSON_AGG(JSON_BUILD_OBJECT(\'warehouseId\', w.id, \'warehouseName\', w.name, \'isManager\', uw.is_manager_of_warehouse)) FILTER (WHERE w.id IS NOT NULL)', 'warehouses')
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
    return rawMembers.map(raw => ({
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
    updaterId: string
  ): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: membershipId }
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    // Permission validation: Check if updater can modify this member's warehouses
    // OWNER and ADMIN can modify both MANAGER and STAFF
    // MANAGER can only modify STAFF
    if (updaterRole === 'OWNER' || updaterRole === 'ADMIN') {
      // OWNER and ADMIN can modify MANAGER and STAFF
      if (membership.role !== 'MANAGER' && membership.role !== 'STAFF') {
        throw new BadRequestException('Can only modify warehouse assignments for MANAGER and STAFF members');
      }
    } else if (updaterRole === 'MANAGER') {
      // MANAGER can only modify STAFF
      if (membership.role !== 'STAFF') {
        throw new BadRequestException('Managers can only modify warehouse assignments for STAFF members');
      }
      // TODO: Check if all warehouseIds are in updater's managed warehouses
      // This requires accessing UserWarehouseService - will be added when wiring services
    } else {
      throw new BadRequestException('Insufficient permissions to modify warehouse assignments');
    }

    // Remove all existing warehouse assignments for this user
    await this.userWarehouseRepository.delete({
      user_id: membership.user_id,
    });

    // Create new warehouse assignments
    const assignments = warehouseIds.map(warehouseId =>
      this.userWarehouseRepository.create({
        user_id: membership.user_id,
        warehouse_id: warehouseId,
        role: membership.role, // Store the user's company role (MANAGER/STAFF)
        is_manager_of_warehouse: membership.role === 'MANAGER', // MANAGERs are managers of their assigned warehouses
      })
    );

    if (assignments.length > 0) {
      await this.userWarehouseRepository.save(assignments);
    }
  }

  //------------------------------------------------------------
  // NEW: Remove member with permission checks
  //------------------------------------------------------------
  async removeMemberWithValidation(
    membershipId: string,
    removerId: string,
    removerRole: string
  ): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: membershipId }
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
        'Insufficient permissions to remove this member'
      );
    }

    // MANAGER can only remove STAFF
    if (removerRole === 'MANAGER' && membership.role !== 'STAFF') {
      throw new BadRequestException('Managers can only remove STAFF members');
    }

    // Set status to inactive
    membership.status = 'inactive';
    await this.userCompanyRepository.save(membership);

    // CRITICAL: Clear Clerk metadata to revoke access immediately
    // If this was their active company, they'll need to switch companies on next request
    try {
      await this.clerkService.updateUserMetadata(membership.user_id, {
        activeCompanyId: undefined,
        activeRole: undefined,
      });
    } catch (error) {
      console.error('Failed to clear Clerk metadata for removed user:', error);
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

    // Lazy import clerkClient to avoid circular dependencies
    const { clerkClient } = await import('@clerk/clerk-sdk-node');

    // Enrich with Clerk user data
    const enrichedMembers = await Promise.all(
      result.map(async (member: any) => {
        try {
          const clerkUser = await clerkClient.users.getUser(member.user_id);
          return {
            user_id: member.user_id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
            role: member.role,
            is_manager: member.is_manager,
          };
        } catch (error) {
          console.error(`Failed to fetch Clerk user ${member.user_id}:`, error);
          return {
            user_id: member.user_id,
            email: 'Unknown',
            fullName: null,
            role: member.role,
            is_manager: member.is_manager,
          };
        }
      })
    );

    return enrichedMembers;
  }

  //------------------------------------------------------------
  // NEW: Set default warehouse for user
  //------------------------------------------------------------
  async setDefaultWarehouse(userId: string, warehouseId: string): Promise<void> {
    // Get user's active company
    const user = await this.clerkService.getUserByClerkId(userId);

    if (!user || !user.activeCompanyId) {
      throw new BadRequestException('User does not have an active company');
    }

    // Update default_warehouse_id in user_companies
    await this.userCompanyRepository.update(
      { user_id: userId, company_id: user.activeCompanyId },
      { default_warehouse_id: warehouseId }
    );
  }
}
