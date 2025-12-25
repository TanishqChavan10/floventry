import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import {
    CreatePurchaseOrderInput,
    UpdatePurchaseOrderInput,
    PurchaseOrderFilterInput,
} from './dto/purchase-order.input';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        @InjectRepository(PurchaseOrder)
        private purchaseOrderRepository: Repository<PurchaseOrder>,
        @InjectRepository(PurchaseOrderItem)
        private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    ) { }

    /**
     * Generate unique PO number for a company
     */
    async generatePONumber(companyId: string): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.purchaseOrderRepository.count({
            where: { company_id: companyId },
        });
        const nextNumber = (count + 1).toString().padStart(4, '0');
        return `PO-${year}-${nextNumber}`;
    }

    /**
     * Get all purchase orders with filters
     */
    async getPurchaseOrders(
        filters: PurchaseOrderFilterInput,
        companyId: string,
    ): Promise<PurchaseOrder[]> {
        const where: any = { company_id: companyId };

        if (filters.warehouse_id) {
            where.warehouse_id = filters.warehouse_id;
        }

        if (filters.supplier_id) {
            where.supplier_id = filters.supplier_id;
        }

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.from_date && filters.to_date) {
            where.created_at = Between(filters.from_date, filters.to_date);
        } else if (filters.from_date) {
            where.created_at = Between(filters.from_date, new Date());
        }

        return this.purchaseOrderRepository.find({
            where,
            relations: ['warehouse', 'supplier', 'user', 'items', 'items.product'],
            order: { created_at: 'DESC' },
            take: filters.limit || 50,
            skip: filters.offset || 0,
        });
    }

    /**
     * Get single purchase order by ID
     */
    async getPurchaseOrder(id: string, companyId: string): Promise<PurchaseOrder> {
        const po = await this.purchaseOrderRepository.findOne({
            where: { id, company_id: companyId },
            relations: ['warehouse', 'supplier', 'user', 'items', 'items.product'],
        });

        if (!po) {
            throw new NotFoundException('Purchase order not found');
        }

        return po;
    }

    /**
     * Create new purchase order
     */
    async createPurchaseOrder(
        input: CreatePurchaseOrderInput,
        companyId: string,
        userId: string,
    ): Promise<PurchaseOrder> {
        // Validate no duplicate products
        const productIds = input.items.map((item) => item.product_id);
        const uniqueProductIds = new Set(productIds);
        if (productIds.length !== uniqueProductIds.size) {
            throw new BadRequestException('Duplicate products in purchase order');
        }

        // Generate PO number
        const poNumber = await this.generatePONumber(companyId);

        // Create PO
        const po = this.purchaseOrderRepository.create({
            company_id: companyId,
            warehouse_id: input.warehouse_id,
            supplier_id: input.supplier_id,
            po_number: poNumber,
            status: PurchaseOrderStatus.DRAFT,
            notes: input.notes,
            created_by: userId,
        });

        await this.purchaseOrderRepository.save(po);

        // Create items
        const items = input.items.map((itemInput) =>
            this.purchaseOrderItemRepository.create({
                purchase_order_id: po.id,
                product_id: itemInput.product_id,
                ordered_quantity: itemInput.ordered_quantity,
                received_quantity: 0,
            }),
        );

        await this.purchaseOrderItemRepository.save(items);

        // Return complete PO with relations
        return this.getPurchaseOrder(po.id, companyId);
    }

    /**
     * Update purchase order (DRAFT only)
     */
    async updatePurchaseOrder(
        id: string,
        input: UpdatePurchaseOrderInput,
        companyId: string,
    ): Promise<PurchaseOrder> {
        const po = await this.getPurchaseOrder(id, companyId);

        // Only DRAFT can be edited
        if (po.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT purchase orders can be edited');
        }

        // Update PO fields
        if (input.supplier_id) {
            po.supplier_id = input.supplier_id;
        }

        if (input.notes !== undefined) {
            po.notes = input.notes;
        }

        await this.purchaseOrderRepository.save(po);

        // Update items if provided
        if (input.items) {
            // Validate no duplicate products
            const productIds = input.items.map((item) => item.product_id);
            const uniqueProductIds = new Set(productIds);
            if (productIds.length !== uniqueProductIds.size) {
                throw new BadRequestException('Duplicate products in purchase order');
            }

            // Delete existing items
            await this.purchaseOrderItemRepository.delete({ purchase_order_id: po.id });

            // Create new items
            const items = input.items.map((itemInput) =>
                this.purchaseOrderItemRepository.create({
                    purchase_order_id: po.id,
                    product_id: itemInput.product_id,
                    ordered_quantity: itemInput.ordered_quantity,
                    received_quantity: 0,
                }),
            );

            await this.purchaseOrderItemRepository.save(items);
        }

        // Return updated PO
        return this.getPurchaseOrder(po.id, companyId);
    }

    /**
     * Mark purchase order as ORDERED
     */
    async markPurchaseOrderOrdered(id: string, companyId: string): Promise<PurchaseOrder> {
        const po = await this.getPurchaseOrder(id, companyId);

        if (po.status !== PurchaseOrderStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT purchase orders can be marked as ORDERED');
        }

        po.status = PurchaseOrderStatus.ORDERED;
        await this.purchaseOrderRepository.save(po);

        return this.getPurchaseOrder(po.id, companyId);
    }

    /**
     * Cancel purchase order
     */
    async cancelPurchaseOrder(id: string, companyId: string): Promise<PurchaseOrder> {
        const po = await this.getPurchaseOrder(id, companyId);

        if (po.status === PurchaseOrderStatus.CLOSED) {
            throw new BadRequestException('Cannot cancel a CLOSED purchase order');
        }

        if (po.status === PurchaseOrderStatus.CANCELLED) {
            throw new BadRequestException('Purchase order is already cancelled');
        }

        po.status = PurchaseOrderStatus.CANCELLED;
        await this.purchaseOrderRepository.save(po);

        return this.getPurchaseOrder(po.id, companyId);
    }
}
