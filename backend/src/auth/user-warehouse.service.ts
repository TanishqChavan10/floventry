import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserWarehouse } from './entities/user-warehouse.entity';
import { User } from './entities/user.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Role } from './enums/role.enum';

@Injectable()
export class UserWarehouseService {
    constructor(
        @InjectRepository(UserWarehouse)
        private userWarehouseRepository: Repository<UserWarehouse>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Warehouse)
        private warehouseRepository: Repository<Warehouse>,
    ) { }

    /**
     * Assign a user to a warehouse
     */
    async assignUserToWarehouse(
        userId: string,
        warehouseId: string,
        isManager: boolean = false,
        assignedBy: string,
        assignedByRole: Role,
    ): Promise<UserWarehouse> {
        // Verify user exists
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify warehouse exists
        const warehouse = await this.warehouseRepository.findOne({ where: { id: warehouseId } });
        if (!warehouse) {
            throw new NotFoundException('Warehouse not found');
        }

        // If assigned by a MANAGER, verify they manage this warehouse
        if (assignedByRole === Role.MANAGER) {
            const managerAccess = await this.canUserManageWarehouse(assignedBy, warehouseId);
            if (!managerAccess) {
                throw new ForbiddenException('You do not have permission to assign users to this warehouse');
            }
        }

        // Check if assignment already exists
        const existing = await this.userWarehouseRepository.findOne({
            where: { user_id: userId, warehouse_id: warehouseId },
        });

        if (existing) {
            // Update existing assignment
            existing.is_manager_of_warehouse = isManager;
            return this.userWarehouseRepository.save(existing);
        }

        // Create new assignment
        const userWarehouse = this.userWarehouseRepository.create({
            user_id: userId,
            warehouse_id: warehouseId,
            is_manager_of_warehouse: isManager,
        });

        return this.userWarehouseRepository.save(userWarehouse);
    }

    /**
     * Remove a user from a warehouse
     */
    async removeUserFromWarehouse(userId: string, warehouseId: string): Promise<boolean> {
        const result = await this.userWarehouseRepository.delete({
            user_id: userId,
            warehouse_id: warehouseId,
        });

        if (result.affected === 0) {
            throw new NotFoundException('User warehouse assignment not found');
        }

        return true;
    }

    /**
     * Get all warehouses a user has access to
     */
    async getUserWarehouses(userId: string): Promise<UserWarehouse[]> {
        return this.userWarehouseRepository.find({
            where: { user_id: userId },
            relations: ['warehouse'],
        });
    }

    /**
     * Get warehouses a user manages (MANAGER only)
     */
    async getManagedWarehouses(userId: string): Promise<UserWarehouse[]> {
        return this.userWarehouseRepository.find({
            where: {
                user_id: userId,
                is_manager_of_warehouse: true,
            },
            relations: ['warehouse'],
        });
    }

    /**
     * Get all users in a warehouse
     */
    async getUsersInWarehouse(warehouseId: string): Promise<UserWarehouse[]> {
        return this.userWarehouseRepository.find({
            where: { warehouse_id: warehouseId },
            relations: ['user'],
        });
    }

    /**
     * Check if user can access a warehouse
     */
    async canUserAccessWarehouse(userId: string, warehouseId: string): Promise<boolean> {
        const access = await this.userWarehouseRepository.findOne({
            where: {
                user_id: userId,
                warehouse_id: warehouseId,
            },
        });

        return !!access;
    }

    /**
     * Check if user can manage a warehouse
     */
    async canUserManageWarehouse(userId: string, warehouseId: string): Promise<boolean> {
        const access = await this.userWarehouseRepository.findOne({
            where: {
                user_id: userId,
                warehouse_id: warehouseId,
                is_manager_of_warehouse: true,
            },
        });

        return !!access;
    }

    /**
     * Bulk assign user to multiple warehouses
     */
    async assignUserToWarehouses(
        userId: string,
        warehouseIds: string[],
        managesWarehouseIds: string[] = [],
        assignedBy: string,
        assignedByRole: Role,
    ): Promise<UserWarehouse[]> {
        const assignments: UserWarehouse[] = [];

        // Assign to managed warehouses first
        for (const warehouseId of managesWarehouseIds) {
            const assignment = await this.assignUserToWarehouse(
                userId,
                warehouseId,
                true,
                assignedBy,
                assignedByRole,
            );
            assignments.push(assignment);
        }

        // Assign to regular access warehouses
        for (const warehouseId of warehouseIds) {
            // Skip if already assigned as manager
            if (managesWarehouseIds.includes(warehouseId)) {
                continue;
            }

            const assignment = await this.assignUserToWarehouse(
                userId,
                warehouseId,
                false,
                assignedBy,
                assignedByRole,
            );
            assignments.push(assignment);
        }

        return assignments;
    }
}
