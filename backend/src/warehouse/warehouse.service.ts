import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { WarehouseSettings } from './warehouse-settings.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UpdateWarehouseSettingsInput } from './dto/update-warehouse.input';
import slugify from 'slugify';

@Injectable()
export class WarehouseService {

  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseSettings)
    private warehouseSettingsRepository: Repository<WarehouseSettings>,
    @InjectRepository(UserWarehouse)
    private userWarehouseRepository: Repository<UserWarehouse>,
    private dataSource: DataSource,
  ) { }

  async create(createWarehouseDto: CreateWarehouseDto, companyId: string, userId: string): Promise<Warehouse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const slug = slugify(createWarehouseDto.name, { lower: true, strict: true });
      // TODO: Check unique slug per company? reusing name for now as requested.

      const warehouse = queryRunner.manager.create(Warehouse, {
        ...createWarehouseDto,
        slug,
        company_id: companyId,
      });
      const savedWarehouse = await queryRunner.manager.save(warehouse);

      const userWarehouse = queryRunner.manager.create(UserWarehouse, {
        user_id: userId,
        warehouse_id: savedWarehouse.id,
        role: 'OWNER',
      });
      await queryRunner.manager.save(userWarehouse);

      await queryRunner.commitTransaction();
      return savedWarehouse;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(companyId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['settings'],
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findOne(id);

    // If setting this warehouse as default, unset all other defaults in the same company
    if (updateWarehouseDto.is_default === true) {
      await this.warehouseRepository.update(
        { company_id: warehouse.company_id },
        { is_default: false }
      );
    }

    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: string): Promise<void> {
    const result = await this.warehouseRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
  }

  async findByUser(userId: string, companyId?: string): Promise<Warehouse[]> {
    const userWarehouses = await this.userWarehouseRepository.find({
      where: { user_id: userId },
      relations: ['warehouse'],
    });

    const warehouses = userWarehouses
      .map((uw) => uw.warehouse)
      .filter((w) => !!w);

    if (!companyId) return warehouses;

    return warehouses.filter((w) => w.company_id === companyId);
  }

  async assignUser(warehouseId: string, userId: string, role?: string): Promise<UserWarehouse> {
    // Check if assignments exists
    const existing = await this.userWarehouseRepository.findOne({
      where: { warehouse_id: warehouseId, user_id: userId },
    });
    if (existing) {
      if (role && existing.role !== role) {
        existing.role = role;
        return this.userWarehouseRepository.save(existing);
      }
      return existing;
    }

    const assignment = this.userWarehouseRepository.create({
      warehouse_id: warehouseId,
      user_id: userId,
      role: role || 'STAFF',
    });
    return this.userWarehouseRepository.save(assignment);
  }

  async removeUser(warehouseId: string, userId: string): Promise<void> {
    await this.userWarehouseRepository.delete({
      warehouse_id: warehouseId,
      user_id: userId,
    });
  }

  async updateSettings(warehouseId: string, input: UpdateWarehouseSettingsInput): Promise<WarehouseSettings> {
    // Check if settings exist
    let settings = await this.warehouseSettingsRepository.findOne({
      where: { warehouse_id: warehouseId },
    });

    if (!settings) {
      // Create new settings if they don't exist
      settings = this.warehouseSettingsRepository.create({
        warehouse_id: warehouseId,
        ...input,
      });
    } else {
      // Update existing settings
      Object.assign(settings, input);
    }

    return this.warehouseSettingsRepository.save(settings);
  }
}