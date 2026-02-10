import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';
import { Product } from '../inventory/entities/product.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(
    createSupplierInput: CreateSupplierInput,
    companyId: string,
  ): Promise<Supplier> {
    // Check for duplicate name (case-insensitive)
    const existingSupplier = await this.supplierRepository.findOne({
      where: {
        company_id: companyId,
        name: createSupplierInput.name,
      },
    });

    if (existingSupplier) {
      throw new BadRequestException(
        `Supplier with name "${createSupplierInput.name}" already exists in this company`,
      );
    }

    const supplier = this.supplierRepository.create({
      ...createSupplierInput,
      company_id: companyId,
    });
    return this.supplierRepository.save(supplier);
  }

  async findAll(
    companyId: string,
    includeArchived: boolean = false,
  ): Promise<Supplier[]> {
    const where: any = { company_id: companyId };

    if (!includeArchived) {
      where.isActive = true;
    }

    return this.supplierRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, company_id: companyId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(
    updateSupplierInput: UpdateSupplierInput,
    companyId: string,
  ): Promise<Supplier> {
    const supplier = await this.findOne(updateSupplierInput.id, companyId);

    // Check for duplicate name if name is being changed
    if (
      updateSupplierInput.name &&
      updateSupplierInput.name !== supplier.name
    ) {
      const existingSupplier = await this.supplierRepository.findOne({
        where: {
          company_id: companyId,
          name: updateSupplierInput.name,
        },
      });

      if (existingSupplier) {
        throw new BadRequestException(
          `Supplier with name "${updateSupplierInput.name}" already exists in this company`,
        );
      }
    }

    Object.assign(supplier, updateSupplierInput);
    return this.supplierRepository.save(supplier);
  }

  async archive(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, companyId);
    supplier.isActive = false;
    return this.supplierRepository.save(supplier);
  }

  async unarchive(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, companyId);
    supplier.isActive = true;
    return this.supplierRepository.save(supplier);
  }

  async getProductCount(supplierId: string): Promise<number> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
      relations: ['products'],
    });

    if (!supplier) {
      return 0;
    }

    const products = await supplier.products;
    return products ? products.length : 0;
  }

  async getProductsBySupplierId(supplierId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { supplier_id: supplierId },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
      },
      order: { name: 'ASC' },
    });
  }
}
