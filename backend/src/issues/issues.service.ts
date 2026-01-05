import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IssueNote, IssueNoteStatus } from './entities/issue-note.entity';
import { IssueNoteItem } from './entities/issue-note-item.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { SalesService } from '../sales/sales.service';
import { CreateIssueNoteInput, UpdateIssueNoteInput } from './dto/issue-note.input';

@Injectable()
export class IssuesService {
    constructor(
        @InjectRepository(IssueNote)
        private issueNoteRepository: Repository<IssueNote>,
        @InjectRepository(IssueNoteItem)
        private issueNoteItemRepository: Repository<IssueNoteItem>,
        @InjectRepository(StockLot)
        private stockLotRepository: Repository<StockLot>,
        @InjectRepository(Stock)
        private stockRepository: Repository<Stock>,
        @InjectRepository(StockMovement)
        private stockMovementRepository: Repository<StockMovement>,
        private salesService: SalesService,
        private dataSource: DataSource,
    ) { }

    async create(
        input: CreateIssueNoteInput,
        companyId: string,
    ): Promise<IssueNote> {
        if (!input.items || input.items.length === 0) {
            throw new BadRequestException('Issue Note must have at least one item');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const issueNote = queryRunner.manager.create(IssueNote, {
                company_id: companyId,
                warehouse_id: input.warehouse_id,
                sales_order_id: input.sales_order_id || (null as any),
                status: IssueNoteStatus.DRAFT,
            } as any);

            const savedNote = await queryRunner.manager.save(issueNote);

            const items = input.items.map(item =>
                queryRunner.manager.create(IssueNoteItem, {
                    issue_note_id: savedNote.id,
                    product_id: item.product_id,
                    stock_lot_id: item.stock_lot_id || (null as any),
                    quantity: item.quantity,
                } as any),
            );

            await queryRunner.manager.save(items);

            await queryRunner.commitTransaction();

            return this.findOne(savedNote.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(warehouseId: string): Promise<IssueNote[]> {
        return this.issueNoteRepository.find({
            where: { warehouse_id: warehouseId },
            relations: ['items', 'items.product', 'items.stock_lot', 'sales_order', 'issuer'],
            order: { created_at: 'DESC' },
        });
    }

    async findAllByCompany(companyId: string): Promise<IssueNote[]> {
        return this.issueNoteRepository.find({
            where: { company_id: companyId },
            relations: ['warehouse', 'items', 'items.product', 'sales_order', 'issuer'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<IssueNote> {
        const issueNote = await this.issueNoteRepository.findOne({
            where: { id },
            relations: [
                'warehouse',
                'company',
                'sales_order',
                'items',
                'items.product',
                'items.stock_lot',
                'issuer',
            ],
        });

        if (!issueNote) {
            throw new NotFoundException(`Issue Note with ID ${id} not found`);
        }

        return issueNote;
    }

    async update(
        id: string,
        input: UpdateIssueNoteInput,
    ): Promise<IssueNote> {
        const issueNote = await this.findOne(id);

        // Can only edit in DRAFT
        if (issueNote.status !== IssueNoteStatus.DRAFT) {
            throw new BadRequestException('Can only edit Issue Notes in DRAFT status');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (input.sales_order_id !== undefined) {
                issueNote.sales_order_id = input.sales_order_id || (null as any);
            }

            await queryRunner.manager.save(issueNote);

            if (input.items) {
                // Delete existing items
                await queryRunner.manager.delete(IssueNoteItem, {
                    issue_note_id: id,
                });

                // Create new items
                const items = input.items.map(item =>
                    queryRunner.manager.create(IssueNoteItem, {
                        issue_note_id: id,
                        product_id: item.product_id,
                        stock_lot_id: item.stock_lot_id || (null as any),
                        quantity: item.quantity,
                    } as any),
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

    /**
     * POST ISSUE NOTE - CRITICAL TRANSACTION
     * This is where stock actually decreases
     */
    async postIssueNote(id: string, userId: string): Promise<IssueNote> {
        const issueNote = await this.findOne(id);

        if (issueNote.status !== IssueNoteStatus.DRAFT) {
            throw new BadRequestException('Can only post DRAFT Issue Notes');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Validate: must have items
            if (!issueNote.items || issueNote.items.length === 0) {
                throw new BadRequestException('Cannot post Issue Note without items');
            }

            // 2. Check expiry for all lots (hard block for expired)
            for (const item of issueNote.items) {
                if (item.stock_lot_id) {
                    const lot = await queryRunner.manager.findOne(StockLot, {
                        where: { id: item.stock_lot_id },
                    });

                    if (!lot) {
                        throw new NotFoundException(`Lot ${item.stock_lot_id} not found`);
                    }

                    // Check if expired
                    if (lot.expiry_date && new Date(lot.expiry_date) < new Date()) {
                        throw new BadRequestException(
                            `Lot for ${item.product?.name || 'product'} is expired`,
                        );
                    }

                    // Validate sufficient quantity
                    if (lot.quantity < item.quantity) {
                        throw new BadRequestException(
                            `Insufficient quantity in lot for ${item.product?.name || 'product'}`,
                        );
                    }
                }
            }

            // 3. Process each item (multi-lot support)
            for (const item of issueNote.items) {
                // Decrease lot quantity
                if (item.stock_lot_id) {
                    await queryRunner.manager.decrement(
                        StockLot,
                        { id: item.stock_lot_id },
                        'quantity',
                        item.quantity,
                    );
                }

                // Create stock movement
                const movement = queryRunner.manager.create(StockMovement, {
                    warehouse_id: issueNote.warehouse_id,
                    company_id: issueNote.company_id,
                    product_id: item.product_id,
                    lot_id: item.stock_lot_id,
                    type: 'ISSUE_OUT',
                    quantity: -item.quantity,
                    reference_type: 'ISSUE_NOTE',
                    reference_id: issueNote.id,
                    performed_by: userId,
                    user_role: 'USER', // TODO: Get actual role
                } as any);
                await queryRunner.manager.save(movement);
            }

            // 4. Update aggregated stock
            const uniqueProducts = [...new Set(issueNote.items.map(i => i.product_id))];
            for (const productId of uniqueProducts) {
                await this.updateAggregatedStock(
                    queryRunner,
                    issueNote.warehouse_id,
                    productId,
                );
            }

            // 5. Update Sales Order if linked
            if (issueNote.sales_order_id) {
                await this.salesService.updateIssuedQuantities(
                    issueNote.sales_order_id,
                    queryRunner,
                );
                await this.salesService.checkAndClose(
                    issueNote.sales_order_id,
                    queryRunner,
                );
            }

            // 6. Finalize issue note
            issueNote.status = IssueNoteStatus.POSTED;
            issueNote.issued_at = new Date();
            issueNote.issued_by = userId;
            await queryRunner.manager.save(issueNote);

            await queryRunner.commitTransaction();

            return this.findOne(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async cancel(id: string): Promise<IssueNote> {
        const issueNote = await this.findOne(id);

        if (issueNote.status === IssueNoteStatus.POSTED) {
            throw new BadRequestException('Cannot cancel POSTED Issue Notes');
        }

        if (issueNote.status === IssueNoteStatus.CANCELLED) {
            throw new BadRequestException('Issue Note is already cancelled');
        }

        issueNote.status = IssueNoteStatus.CANCELLED;
        await this.issueNoteRepository.save(issueNote);

        return this.findOne(id);
    }

    /**
     * Recalculate aggregated stock quantity for a product in a warehouse
     */
    private async updateAggregatedStock(
        queryRunner: any,
        warehouseId: string,
        productId: string,
    ): Promise<void> {
        const result = await queryRunner.manager
            .createQueryBuilder(StockLot, 'lot')
            .select('SUM(lot.quantity)', 'total')
            .where('lot.warehouse_id = :warehouseId', { warehouseId })
            .andWhere('lot.product_id = :productId', { productId })
            .getRawOne();

        const totalQuantity = parseInt(result?.total || '0', 10);

        // Update or create stock record
        const existingStock = await queryRunner.manager.findOne(Stock, {
            where: { warehouse_id: warehouseId, product_id: productId },
        });

        if (existingStock) {
            existingStock.quantity = totalQuantity;
            await queryRunner.manager.save(existingStock);
        }
    }
}
