import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async fetchRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { created_at: 'ASC' },
    });
  }

  async getRoleById(roleId: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { role_id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  // Initialize default roles if they don't exist
  async initializeDefaultRoles(): Promise<void> {
    const existingRoles = await this.roleRepository.count();

    if (existingRoles > 0) {
      return; // Already initialized
    }

    const defaultRoles = [
      {
        name: 'Owner',
        description: 'Full access to all company features',
        permissions: ['*'],
        color: '#FF0000',
        is_default: false,
      },
      {
        name: 'Admin',
        description: 'Administrative access with most permissions',
        permissions: ['manage_users', 'manage_inventory', 'view_reports'],
        color: '#FFA500',
        is_default: false,
      },
      {
        name: 'Manager',
        description: 'Manage inventory and view reports',
        permissions: ['manage_inventory', 'view_reports'],
        color: '#0000FF',
        is_default: false,
      },
      {
        name: 'Employee',
        description: 'Basic employee access',
        permissions: ['view_inventory'],
        color: '#008000',
        is_default: true,
      },
    ];

    for (const roleData of defaultRoles) {
      const role = this.roleRepository.create(roleData);
      await this.roleRepository.save(role);
    }
  }
}
