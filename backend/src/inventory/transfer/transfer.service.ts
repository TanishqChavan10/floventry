import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, MoreThan } from 'typeorm';
import {
  WarehouseTransfer,
  TransferStatus,
} from './entities/warehouse-transfer.entity';
import { WarehouseTransferItem } from './entities/warehouse-transfer-item.entity';
import { Stock } from '../entities/stock.entity';
import {
  StockLot,
  LotSourceType,
} from '../stock-lot/entities/stock-lot.entity';
import {
  StockMovement,
  MovementType,
  ReferenceType,
} from '../entities/stock-movement.entity';
import {
  CreateTransferInput,
  UpdateTransferInput,
  TransferFilterInput,
} from './dto/transfer.input';
import { Role } from '../../auth/enums/role.enum';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuditAction, AuditEntityType } from '../../audit/enums/audit.enums';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(WarehouseTransfer)
    private transferRepository: Repository<WarehouseTransfer>,
    @InjectRepository(WarehouseTransferItem)
    private transferItemRepository: Repository<WarehouseTransferItem>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockLot)
    private stockLotRepository: Repository<StockLot>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Generate unique transfer number for a company
   */
  async generateTransferNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.transferRepository.count({
      where: { company_id: companyId },
    });
    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `TRF-${year}-${nextNumber}`;
  }

  /**
   * Get all warehouse transfers with filters
   */
  async getTransfers(
    filters: TransferFilterInput,
    companyId: string,
  ): Promise<WarehouseTransfer[]> {
    const where: any = { company_id: companyId };

    if (filters.source_warehouse_id) {
      where.source_warehouse_id = filters.source_warehouse_id;
    }

    if (filters.destination_warehouse_id) {
      where.destination_warehouse_id = filters.destination_warehouse_id;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from_date && filters.to_date) {
      where.created_at = Between(filters.from_date, filters.to_date);
    } else if (filters.from_date) {
      where.created_at = Between(filters.from_date, new Date());
    }

    return this.transferRepository.find({
      where,
      relations: [
        'source_warehouse',
        'destination_warehouse',
        'user',
        'items',
        'items.product',
      ],
      order: { created_at: 'DESC' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Get single warehouse transfer by ID
   */
  async getTransfer(id: string, companyId: string): Promise<WarehouseTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id, company_id: companyId },
      relations: [
        'source_warehouse',
        'destination_warehouse',
        'user',
        'items',
        'items.product',
      ],
    });

    if (!transfer) {
      throw new NotFoundException('Warehouse transfer not found');
    }

    return transfer;
  }

  /**
   * Create new warehouse transfer (DRAFT status)
   */
  async createTransfer(
    input: CreateTransferInput,
    companyId: string,
    userId: string,
    userRole?: string,
  ): Promise<WarehouseTransfer> {
    // Validate source and destination warehouses are different
    if (input.source_warehouse_id === input.destination_warehouse_id) {
      throw new BadRequestException(
        'Source and destination warehouses must be different',
      );
    }

    // Validate quantities
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          'Transfer quantity must be greater than 0',
        );
      }

      // Check if stock exists in source warehouse
      const stock = await this.stockRepository.findOne({
        where: {
          warehouse_id: input.source_warehouse_id,
          product_id: item.product_id,
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock in source warehouse for product ${item.product_id}`,
        );
      }
    }

    // Generate transfer number
    const transferNumber = await this.generateTransferNumber(companyId);

    // Create transfer
    const transfer = this.transferRepository.create({
      company_id: companyId,
      source_warehouse_id: input.source_warehouse_id,
      destination_warehouse_id: input.destination_warehouse_id,
      transfer_number: transferNumber,
      status: TransferStatus.DRAFT,
      notes: input.notes,
      created_by: userId,
      user_role: userRole,
    });

    await this.transferRepository.save(transfer);

    // Create transfer items
    const items = input.items.map((itemInput) =>
      this.transferItemRepository.create({
        warehouse_transfer_id: transfer.id,
        product_id: itemInput.product_id,
        quantity: itemInput.quantity,
      }),
    );

    await this.transferItemRepository.save(items);

    // Return complete transfer
    return this.getTransfer(transfer.id, companyId);
  }

  /**
   * Update warehouse transfer (DRAFT only)
   */
  async updateTransfer(
    id: string,
    input: UpdateTransferInput,
    companyId: string,
  ): Promise<WarehouseTransfer> {
    const transfer = await this.getTransfer(id, companyId);

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Can only edit DRAFT transfers');
    }

    // Update basic fields
    if (input.notes !== undefined) {
      transfer.notes = input.notes;
    }

    await this.transferRepository.save(transfer);

    // Update items if provided
    if (input.items) {
      // Validate new quantities
      for (const item of input.items) {
        if (item.quantity <= 0) {
          throw new BadRequestException(
            'Transfer quantity must be greater than 0',
          );
        }

        // Check if stock exists in source warehouse
        const stock = await this.stockRepository.findOne({
          where: {
            warehouse_id: transfer.source_warehouse_id,
            product_id: item.product_id,
          },
        });

        if (!stock || stock.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock in source warehouse for product ${item.product_id}`,
          );
        }
      }

      // Delete existing items
      await this.transferItemRepository.delete({
        warehouse_transfer_id: transfer.id,
      });

      // Create new items
      const newItems = input.items.map((itemInput) =>
        this.transferItemRepository.create({
          warehouse_transfer_id: transfer.id,
          product_id: itemInput.product_id,
          quantity: itemInput.quantity,
        }),
      );

      await this.transferItemRepository.save(newItems);
    }

    return this.getTransfer(transfer.id, companyId);
  }

  /**
   * Post warehouse transfer (Updates stock - ATOMIC TRANSACTION)
   */
  async postTransfer(
    id: string,
    companyId: string,
    userId: string,
    userRole?: string,
  ): Promise<WarehouseTransfer> {
    const transfer = await this.getTransfer(id, companyId);

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Can only post DRAFT transfers');
    }

    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // For each transfer item, use lot-based inventory logic
      for (const item of transfer.items) {
        const transferQty = Math.floor(Number(item.quantity));

        // 1. Fetch all lots in source warehouse for this product (FIFO: earliest received first)
        const sourceLots = await queryRunner.manager.find(StockLot, {
          where: {
            warehouse_id: transfer.source_warehouse_id,
            product_id: item.product_id,
            quantity: MoreThan(0),
          },
          order: { received_at: 'ASC' },
        });

        const totalAvailable = sourceLots.reduce(
          (sum, l) => sum + Math.floor(Number(l.quantity)),
          0,
        );

        if (totalAvailable < transferQty) {
          throw new BadRequestException(
            `Insufficient stock in source warehouse for product ${item.product_id}. Available: ${totalAvailable}, Required: ${transferQty}`,
          );
        }

        // 2. Fetch source aggregate stock record
        const sourceStock = await queryRunner.manager.findOne(Stock, {
          where: {
            warehouse_id: transfer.source_warehouse_id,
            product_id: item.product_id,
          },
        });

        if (!sourceStock) {
          throw new BadRequestException(
            `Stock not found in source warehouse for product ${item.product_id}`,
          );
        }

        const sourcePreviousQty = Math.floor(Number(sourceStock.quantity));
        const sourceNewQty = sourcePreviousQty - transferQty;

        // 3. Consume lots FIFO and create a mirrored destination lot per source lot
        let remaining = transferQty;

        // Fetch/create destination stock record once before the lot loop
        let destStock = await queryRunner.manager.findOne(Stock, {
          where: {
            warehouse_id: transfer.destination_warehouse_id,
            product_id: item.product_id,
          },
        });

        let destRunningQty = destStock
          ? Math.floor(Number(destStock.quantity))
          : 0;
        const destPreviousQty = destRunningQty;

        if (!destStock) {
          destStock = queryRunner.manager.create(Stock, {
            company_id: transfer.company_id,
            warehouse_id: transfer.destination_warehouse_id,
            product_id: item.product_id,
            quantity: 0,
            min_stock_level: 0,
            max_stock_level: 1000,
            reorder_point: 10,
          });
          await queryRunner.manager.save(Stock, destStock);
        }

        for (const sourceLot of sourceLots) {
          if (remaining <= 0) break;

          const lotAvailable = Math.floor(Number(sourceLot.quantity));
          const consumed = Math.min(lotAvailable, remaining);
          remaining -= consumed;

          // Reduce source lot
          sourceLot.quantity = lotAvailable - consumed;
          await queryRunner.manager.save(StockLot, sourceLot);

          // Stock movement: source OUT (per lot)
          const sourceMovement = queryRunner.manager.create(StockMovement, {
            stock_id: sourceStock.id,
            lot_id: sourceLot.id,
            company_id: transfer.company_id,
            warehouse_id: transfer.source_warehouse_id,
            product_id: item.product_id,
            type: MovementType.OUT,
            quantity: consumed,
            previous_quantity: sourcePreviousQty,
            new_quantity: sourceNewQty,
            reference_type: ReferenceType.TRANSFER,
            reference_id: transfer.id,
            performed_by: userId,
            user_role: userRole,
            notes: `Transferred out via ${transfer.transfer_number}${sourceLot.expiry_date ? ` (Lot expiry: ${sourceLot.expiry_date.toISOString().split('T')[0]})` : ''}`,
          });
          await queryRunner.manager.save(StockMovement, sourceMovement);

          // Create mirrored destination lot (preserving expiry)
          const destLot = queryRunner.manager.create(StockLot, {
            company_id: transfer.company_id,
            warehouse_id: transfer.destination_warehouse_id,
            product_id: item.product_id,
            quantity: consumed,
            expiry_date: sourceLot.expiry_date,
            received_at: new Date(),
            source_type: LotSourceType.TRANSFER,
            source_id: transfer.id,
          });
          await queryRunner.manager.save(StockLot, destLot);

          const destLotPrevQty = destRunningQty;
          destRunningQty += consumed;

          // Stock movement: destination IN (per lot)
          const destMovement = queryRunner.manager.create(StockMovement, {
            stock_id: destStock.id,
            lot_id: destLot.id,
            company_id: transfer.company_id,
            warehouse_id: transfer.destination_warehouse_id,
            product_id: item.product_id,
            type: MovementType.IN,
            quantity: consumed,
            previous_quantity: destLotPrevQty,
            new_quantity: destRunningQty,
            reference_type: ReferenceType.TRANSFER,
            reference_id: transfer.id,
            performed_by: userId,
            user_role: userRole,
            notes: `Transferred in via ${transfer.transfer_number}${destLot.expiry_date ? ` (Lot expiry: ${destLot.expiry_date.toISOString().split('T')[0]})` : ''}`,
          });
          await queryRunner.manager.save(StockMovement, destMovement);
        }

        // 4. Update source aggregate stock
        await queryRunner.manager
          .createQueryBuilder()
          .update(Stock)
          .set({ quantity: sourceNewQty })
          .where('id = :id', { id: sourceStock.id })
          .andWhere('quantity >= :quantity', { quantity: transferQty })
          .execute();

        // 5. Update destination aggregate stock
        const destNewQty = destPreviousQty + transferQty;
        await queryRunner.manager
          .createQueryBuilder()
          .update(Stock)
          .set({ quantity: destNewQty })
          .where('id = :id', { id: destStock.id })
          .execute();
      }

      // Update transfer status
      transfer.status = TransferStatus.POSTED;
      await queryRunner.manager.save(WarehouseTransfer, transfer);

      // Commit transaction
      await queryRunner.commitTransaction();

      const result = await this.getTransfer(transfer.id, companyId);

      // Record audit log (fire-and-forget)
      try {
        await this.auditLogService.record({
          companyId: transfer.company_id,
          actor: {
            id: userId,
            email: result.user?.email || 'unknown',
            role: userRole || transfer.user_role || 'STAFF',
          },
          action: AuditAction.TRANSFER_POSTED,
          entityType: AuditEntityType.TRANSFER,
          entityId: transfer.id,
          metadata: {
            transferNumber: transfer.transfer_number,
            sourceWarehouseName: result.source_warehouse?.name,
            sourceWarehouseSlug: (result as any).source_warehouse?.slug,
            destinationWarehouseName: result.destination_warehouse?.name,
            destinationWarehouseSlug: (result as any).destination_warehouse
              ?.slug,
            itemCount: result.items?.length || 0,
          },
        });
      } catch (err) {
        console.error('Failed to record audit log for transfer posting:', err);
      }

      // Notify OWNER, ADMIN and warehouse managers (fire-and-forget)
      this.notificationsService
        .notifyTransferCompleted(
          transfer.company_id,
          await this.notificationsService.getRecipients(
            transfer.company_id,
            transfer.source_warehouse_id,
          ),
          result.id,
          result.transfer_number,
        )
        .catch((err) =>
          console.error('Failed to send transfer notification:', err),
        );

      return result;
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel warehouse transfer (DRAFT only, OWNER/ADMIN only)
   */
  async cancelTransfer(
    id: string,
    companyId: string,
  ): Promise<WarehouseTransfer> {
    const transfer = await this.getTransfer(id, companyId);

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Can only cancel DRAFT transfers');
    }

    transfer.status = TransferStatus.CANCELLED;
    await this.transferRepository.save(transfer);

    return this.getTransfer(transfer.id, companyId);
  }
}
