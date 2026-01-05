import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { CreateSalesOrderInput, UpdateSalesOrderInput } from './dto/sales-order.input';

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(SalesOrder)
        private salesOrderRepository: Repository<SalesOrder>,
        @InjectRepository(SalesOrderItem)
        private salesOrderItemRepository: Repository<SalesOrderItem>,
        private dataSource: DataSource,
    ) { }

    async create(
        input: CreateSalesOrderInput,
        companyId: string,
        userId: string,
    ): Promise<SalesOrder> {
        // Validate: must have items
        if (!input.items || input.items.length === 0) {
            throw new BadRequestException('Sales Order must have at least one item');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create Sales Order
            const salesOrder = queryRunner.manager.create(SalesOrder, {
                company_id: companyId,
                customer_name: input.customer_name,
                expected_dispatch_date: input.expected_dispatch_date
                    ? new Date(input.expected_dispatch_date)
                    : (null as any),
                status: SalesOrderStatus.DRAFT,
                created_by: userId,
            } as any);

            const savedOrder = await queryRunner.manager.save(salesOrder);

            // Create Sales Order Items
            const items = input.items.map(item =>
                queryRunner.manager.create(SalesOrderItem, {
                    sales_order_id: savedOrder.id,
                    product_id: item.product_id,
                    ordered_quantity: item.ordered_quantity,
                    issued_quantity: 0,
                }),
            );

            await queryRunner.manager.save(items);

            await queryRunner.commitTransaction();

            // Return with relations
            return this.findOne(savedOrder.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(companyId: string): Promise<SalesOrder[]> {
        return this.salesOrderRepository.find({
            where: { company_id: companyId },
            relations: ['items', 'items.product', 'creator'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<SalesOrder> {
        const salesOrder = await this.salesOrderRepository.findOne({
            where: { id },
            relations: ['items', 'items.product', 'company', 'creator'],
        });

        if (!salesOrder) {
            throw new NotFoundException(`Sales Order with ID ${id} not found`);
        }

        return salesOrder;
    }

    async update(
        id: string,
        input: UpdateSalesOrderInput,
        userId: string,
    ): Promise<SalesOrder> {
        const salesOrder = await this.findOne(id);

        // Can only edit in DRAFT
        if (salesOrder.status !== SalesOrderStatus.DRAFT) {
            throw new BadRequestException('Can only edit Sales Orders in DRAFT status');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update Sales Order
            if (input.customer_name) {
                salesOrder.customer_name = input.customer_name;
            }
            if (input.expected_dispatch_date !== undefined) {
                salesOrder.expected_dispatch_date = input.expected_dispatch_date
                    ? new Date(input.expected_dispatch_date)
                    : (null as any);
            }

            await queryRunner.manager.save(salesOrder);

            // Update items if provided
            if (input.items) {
                // Delete existing items
                await queryRunner.manager.delete(SalesOrderItem, {
                    sales_order_id: id,
                });

                // Create new items
                const items = input.items.map(item =>
                    queryRunner.manager.create(SalesOrderItem, {
                        sales_order_id: id,
                        product_id: item.product_id,
                        ordered_quantity: item.ordered_quantity,
                        issued_quantity: 0,
                    }),
                );

                await queryRunner.manager.save(items);
            }

            await queryRunner.commitTransaction();

            return this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async confirm(id: string): Promise<SalesOrder> {
        const salesOrder = await this.findOne(id);

        if (salesOrder.status !== SalesOrderStatus.DRAFT) {
            throw new BadRequestException('Can only confirm DRAFT Sales Orders');
        }

        // Validate: must have items
        if (!salesOrder.items || salesOrder.items.length === 0) {
            throw new BadRequestException('Cannot confirm Sales Order without items');
        }

        salesOrder.status = SalesOrderStatus.CONFIRMED;
        await this.salesOrderRepository.save(salesOrder);

        return this.findOne(id);
    }

    async cancel(id: string): Promise<SalesOrder> {
        const salesOrder = await this.findOne(id);

        // Cannot cancel if already CLOSED
        if (salesOrder.status === SalesOrderStatus.CLOSED) {
            throw new BadRequestException('Cannot cancel CLOSED Sales Orders');
        }

        if (salesOrder.status === SalesOrderStatus.CANCELLED) {
            throw new BadRequestException('Sales Order is already cancelled');
        }

        salesOrder.status = SalesOrderStatus.CANCELLED;
        await this.salesOrderRepository.save(salesOrder);

        return this.findOne(id);
    }

    // Called from IssueService after posting
    async updateIssuedQuantities(
        salesOrderId: string,
        queryRunner?: any,
    ): Promise<void> {
        const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

        // Recalculate issued_quantity from all posted issue_note_items
        await manager.query(`
      UPDATE sales_order_items soi
      SET issued_quantity = (
        SELECT COALESCE(SUM(ini.quantity), 0)
        FROM issue_note_items ini
        INNER JOIN issue_notes inn ON inn.id = ini.issue_note_id
        WHERE inn.sales_order_id = soi.sales_order_id
          AND inn.status = 'POSTED'
          AND ini.product_id = soi.product_id
      )
      WHERE soi.sales_order_id = $1
    `, [salesOrderId]);
    }

    // Check if fully issued and auto-close
    async checkAndClose(
        salesOrderId: string,
        queryRunner?: any,
    ): Promise<void> {
        const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

        const salesOrder = await manager.findOne(SalesOrder, {
            where: { id: salesOrderId },
            relations: ['items'],
        });

        if (!salesOrder || salesOrder.status === SalesOrderStatus.CLOSED) {
            return;
        }

        // Check if all items fully issued
        const fullyIssued = salesOrder.items.every(
            item => item.issued_quantity >= item.ordered_quantity,
        );

        if (fullyIssued) {
            salesOrder.status = SalesOrderStatus.CLOSED;
            await manager.save(salesOrder);
        }
    }
}
