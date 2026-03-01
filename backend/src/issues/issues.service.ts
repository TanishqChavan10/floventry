import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { IssueNote, IssueNoteStatus } from './entities/issue-note.entity';
import { IssueNoteItem } from './entities/issue-note-item.entity';
import { StockLot } from '../inventory/stock-lot/entities/stock-lot.entity';
import { normalizeExpiryToEndOfDayUTC } from '../common/utils/expiry-date';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { SalesService } from '../sales/sales.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateIssueNoteInput,
  UpdateIssueNoteInput,
  CreateFEFOIssueNoteInput,
} from './dto/issue-note.input';
import {
  MovementType,
  ReferenceType,
} from '../inventory/entities/stock-movement.entity';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, AuditEntityType } from '../audit/enums/audit.enums';

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
    private notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
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
      // Generate issue_number
      const count = await queryRunner.manager.count(IssueNote, {
        where: { warehouse_id: input.warehouse_id },
      });
      const issueNumber = `ISS-${String(count + 1).padStart(5, '0')}`;

      const issueNote = queryRunner.manager.create(IssueNote, {
        company_id: companyId,
        warehouse_id: input.warehouse_id,
        issue_number: issueNumber,
        sales_order_id: input.sales_order_id || (null as any),
        status: IssueNoteStatus.DRAFT,
      } as any);

      const savedNote = await queryRunner.manager.save(issueNote);

      const items = input.items.map((item) =>
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

  /**
   * Create Issue Note with FEFO auto-selection
   * This is the recommended way to create issues - lots are selected automatically
   */
  async createWithFEFO(
    input: any, // CreateFEFOIssueNoteInput
    companyId: string,
  ): Promise<IssueNote> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Issue Note must have at least one item');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate issue_number
      const count = await queryRunner.manager.count(IssueNote, {
        where: { warehouse_id: input.warehouse_id },
      });
      const issueNumber = `ISS-${String(count + 1).padStart(5, '0')}`;

      const issueNote = queryRunner.manager.create(IssueNote, {
        company_id: companyId,
        warehouse_id: input.warehouse_id,
        issue_number: issueNumber,
        sales_order_id: input.sales_order_id || (null as any),
        status: IssueNoteStatus.DRAFT,
      } as any);

      const savedNote = await queryRunner.manager.save(issueNote);

      // For each product, use FEFO to select lots
      const issueItems: IssueNoteItem[] = [];

      for (const inputItem of input.items) {
        const selectedLots = await this.selectLotsWithFEFO(
          queryRunner,
          input.warehouse_id,
          inputItem.product_id,
          inputItem.quantity,
        );

        // Create an issue item for each selected lot
        for (const { lot, quantity } of selectedLots) {
          const item = queryRunner.manager.create(IssueNoteItem, {
            issue_note_id: savedNote.id,
            product_id: inputItem.product_id,
            stock_lot_id: lot.id,
            quantity,
          } as any);
          issueItems.push(item);
        }
      }

      await queryRunner.manager.save(issueItems);

      await queryRunner.commitTransaction();

      return this.findOne(savedNote.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    warehouseId: string,
    limit?: number,
    offset?: number,
  ): Promise<IssueNote[]> {
    return this.issueNoteRepository.find({
      where: { warehouse_id: warehouseId },
      relations: [
        'items',
        'items.product',
        'items.stock_lot',
        'sales_order',
        'issuer',
      ],
      order: { created_at: 'DESC' },
      take: limit || 50,
      skip: offset || 0,
    });
  }

  async findAllByCompany(
    companyId: string,
    limit?: number,
    offset?: number,
  ): Promise<IssueNote[]> {
    return this.issueNoteRepository.find({
      where: { company_id: companyId },
      relations: [
        'warehouse',
        'items',
        'items.product',
        'sales_order',
        'issuer',
      ],
      order: { created_at: 'DESC' },
      take: limit || 50,
      skip: offset || 0,
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

  async update(id: string, input: UpdateIssueNoteInput): Promise<IssueNote> {
    const issueNote = await this.findOne(id);

    // Can only edit in DRAFT
    if (issueNote.status !== IssueNoteStatus.DRAFT) {
      throw new BadRequestException(
        'Can only edit Issue Notes in DRAFT status',
      );
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
        const items = input.items.map((item) =>
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
   * FEFO: First-Expiry-First-Out lot selection algorithm
   * Selects lots by earliest expiry date, skips expired lots
   */
  private async selectLotsWithFEFO(
    queryRunner: any,
    warehouseId: string,
    productId: string,
    requiredQuantity: number,
  ): Promise<Array<{ lot: StockLot; quantity: number; expiryStatus: string }>> {
    // Get all available lots for this product in this warehouse
    // Order by: expiry_date ASC (nulls last), received_at ASC
    const lots = await queryRunner.manager
      .createQueryBuilder(StockLot, 'lot')
      .where('lot.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('lot.product_id = :productId', { productId })
      .andWhere('lot.quantity > 0')
      .orderBy('lot.expiry_date', 'ASC', 'NULLS LAST')
      .addOrderBy('lot.received_at', 'ASC')
      .getMany();

    const selectedLots: Array<{
      lot: StockLot;
      quantity: number;
      expiryStatus: string;
    }> = [];
    let remaining = requiredQuantity;
    const now = new Date();

    for (const lot of lots) {
      // HARD BLOCK: Skip expired lots
      if (
        lot.expiry_date &&
        normalizeExpiryToEndOfDayUTC(new Date(lot.expiry_date)) < now
      ) {
        continue; // Cannot use expired lots
      }

      // Skip if no quantity
      if (lot.quantity <= 0) continue;

      // Calculate how much to consume from this lot
      const consumeQty = Math.min(lot.quantity, remaining);

      // Determine expiry status
      let expiryStatus = 'OK';
      if (lot.expiry_date) {
        const daysUntilExpiry = Math.ceil(
          (normalizeExpiryToEndOfDayUTC(new Date(lot.expiry_date)).getTime() -
            now.getTime()) /
          (1000 * 60 * 60 * 24),
        );
        if (daysUntilExpiry <= 30) {
          expiryStatus = 'EXPIRING_SOON';
        } else if (daysUntilExpiry < 0) {
          expiryStatus = 'EXPIRED';
        }
      }

      selectedLots.push({
        lot,
        quantity: consumeQty,
        expiryStatus,
      });

      remaining -= consumeQty;
      if (remaining <= 0) break;
    }

    // If we couldn't fulfill the quantity, throw error
    if (remaining > 0) {
      throw new BadRequestException(
        `Insufficient stock for product. Required: ${requiredQuantity}, Available: ${requiredQuantity - remaining}`,
      );
    }

    return selectedLots;
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
          if (
            lot.expiry_date &&
            normalizeExpiryToEndOfDayUTC(new Date(lot.expiry_date)) < new Date()
          ) {
            throw new BadRequestException(
              `Lot for ${item.product?.name || 'product'} is expired`,
            );
          }

          // Validate sufficient quantity
          const lotQuantity = Number(lot.quantity);
          const itemQuantity = Number(item.quantity);
          if (Number.isNaN(lotQuantity) || Number.isNaN(itemQuantity)) {
            throw new BadRequestException(
              `Invalid quantity for ${item.product?.name || 'product'}`,
            );
          }

          if (lotQuantity < itemQuantity) {
            throw new BadRequestException(
              `Insufficient quantity in lot for ${item.product?.name || 'product'}`,
            );
          }
        }
      }

      // Preload Stock rows for movement FK (stock_id is NOT NULL)
      const uniqueProducts = [
        ...new Set(issueNote.items.map((i) => i.product_id)),
      ];
      const stockRows = await queryRunner.manager.find(Stock, {
        where: {
          warehouse_id: issueNote.warehouse_id,
          product_id: In(uniqueProducts),
        },
      });
      const stockIdByProductId = new Map<string, string>();
      for (const row of stockRows) {
        stockIdByProductId.set(row.product_id, row.id);
      }

      // 3. Process each item (multi-lot support)
      for (const item of issueNote.items) {
        const itemQuantity = Number(item.quantity);
        if (Number.isNaN(itemQuantity)) {
          throw new BadRequestException(
            `Invalid quantity for ${item.product?.name || 'product'}`,
          );
        }

        // Ensure we have a Stock row for FK
        let stockId = stockIdByProductId.get(item.product_id);
        if (!stockId) {
          // Create missing stock row based on current lots total
          const lotTotal = await queryRunner.manager
            .createQueryBuilder(StockLot, 'lot')
            .select('SUM(lot.quantity)', 'total')
            .where('lot.warehouse_id = :warehouseId', {
              warehouseId: issueNote.warehouse_id,
            })
            .andWhere('lot.product_id = :productId', {
              productId: item.product_id,
            })
            .getRawOne();

          const totalQuantity = Number(lotTotal?.total ?? 0);

          const createdStock = queryRunner.manager.create(Stock, {
            company_id: issueNote.company_id,
            warehouse_id: issueNote.warehouse_id,
            product_id: item.product_id,
            quantity: Number.isNaN(totalQuantity) ? 0 : totalQuantity,
          } as any);
          const savedStock = await queryRunner.manager.save(createdStock);
          stockId = savedStock.id;
          stockIdByProductId.set(item.product_id, stockId);
        }

        // Decrease lot quantity
        if (item.stock_lot_id) {
          await queryRunner.manager.decrement(
            StockLot,
            { id: item.stock_lot_id },
            'quantity',
            itemQuantity,
          );
        }

        // Create stock movement
        const movement = queryRunner.manager.create(StockMovement, {
          stock_id: stockId,
          warehouse_id: issueNote.warehouse_id,
          company_id: issueNote.company_id,
          product_id: item.product_id,
          lot_id: item.stock_lot_id,
          type: MovementType.OUT,
          quantity: -itemQuantity,
          reference_type: issueNote.sales_order_id
            ? ReferenceType.SALES_ORDER
            : ReferenceType.MANUAL,
          reference_id: issueNote.sales_order_id || issueNote.id,
          performed_by: userId,
          user_role: 'USER', // TODO: Get actual role
          notes: issueNote.sales_order_id
            ? `Issued for sales order ${issueNote.sales_order_id}`
            : `Issued via issue note ${issueNote.issue_number}`,
        } as any);
        await queryRunner.manager.save(movement);
      }

      // 4. Update aggregated stock
      for (const productId of uniqueProducts) {
        await this.updateAggregatedStock(
          queryRunner,
          issueNote.company_id,
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

      // Notify users about issued note (async, don't block)
      const result = await this.findOne(id);
      this.notificationsService
        .notifyIssuePosted(
          issueNote.company_id,
          [userId],
          result.id,
          result.issue_number,
          issueNote.warehouse_id,
        )
        .catch((err) => console.error('Failed to send notification:', err));

      // Record audit log (fire-and-forget)
      try {
        await this.auditLogService.record({
          companyId: issueNote.company_id,
          actor: {
            id: userId,
            email: result.issuer?.email || 'unknown',
            role: 'STAFF',
          },
          action: AuditAction.ISSUE_POSTED,
          entityType: AuditEntityType.ISSUE,
          entityId: issueNote.id,
          metadata: {
            issueNumber: result.issue_number,
            warehouseName: (result as any).warehouse?.name,
            warehouseSlug: (result as any).warehouse?.slug,
            itemCount: result.items?.length || 0,
            salesOrderId: result.sales_order_id || undefined,
          },
        });
      } catch (err) {
        console.error('Failed to record audit log for issue posting:', err);
      }

      return result;
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
    companyId: string,
    warehouseId: string,
    productId: string,
  ): Promise<void> {
    const result = await queryRunner.manager
      .createQueryBuilder(StockLot, 'lot')
      .select('SUM(lot.quantity)', 'total')
      .where('lot.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('lot.product_id = :productId', { productId })
      .getRawOne();

    const totalQuantity = Number(result?.total ?? 0);

    // Update or create stock record
    const existingStock = await queryRunner.manager.findOne(Stock, {
      where: { warehouse_id: warehouseId, product_id: productId },
    });

    if (existingStock) {
      existingStock.quantity = totalQuantity;
      await queryRunner.manager.save(existingStock);
    } else {
      const createdStock = queryRunner.manager.create(Stock, {
        warehouse_id: warehouseId,
        product_id: productId,
        company_id: companyId,
        quantity: totalQuantity,
      } as any);
      await queryRunner.manager.save(createdStock);
    }
  }
}
