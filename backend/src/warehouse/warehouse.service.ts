import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './warehouse.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      relations: ['company'],
    });
  }

  async findOne(id: string): Promise<Warehouse | null> {
    return this.warehouseRepository.findOne({
      where: { id },
      relations: ['company'],
    });
  }

  async create(warehouseData: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create(warehouseData);
    return this.warehouseRepository.save(warehouse);
  }

  async update(id: string, warehouseData: Partial<Warehouse>): Promise<Warehouse> {
    await this.warehouseRepository.update(id, warehouseData);
    const warehouse = await this.findOne(id);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }
    return warehouse;
  }

  async remove(id: string): Promise<void> {
    await this.warehouseRepository.softDelete(id);
  }
}