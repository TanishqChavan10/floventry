import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierInput, UpdateSupplierInput } from './dto/supplier.input';

@Injectable()
export class SupplierService {
    constructor(
        @InjectRepository(Supplier)
        private supplierRepository: Repository<Supplier>,
    ) { }

    async create(createSupplierInput: CreateSupplierInput, companyId: string): Promise<Supplier> {
        const supplier = this.supplierRepository.create({
            ...createSupplierInput,
            company_id: companyId,
        });
        return this.supplierRepository.save(supplier);
    }

    async findAll(companyId: string): Promise<Supplier[]> {
        return this.supplierRepository.find({
            where: { company_id: companyId },
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

    async update(updateSupplierInput: UpdateSupplierInput, companyId: string): Promise<Supplier> {
        const supplier = await this.findOne(updateSupplierInput.id, companyId);
        Object.assign(supplier, updateSupplierInput);
        return this.supplierRepository.save(supplier);
    }

    async remove(id: string, companyId: string): Promise<boolean> {
        const result = await this.supplierRepository.delete({ id, company_id: companyId });
        if (result.affected === 0) {
            throw new NotFoundException(`Supplier with ID ${id} not found`);
        }
        return true;
    }
}
