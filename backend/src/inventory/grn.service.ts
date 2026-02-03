import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import {
  GoodsReceiptNote,
  GRNStatus,
} from './entities/goods-receipt-note.entity';
import { GRNItem } from './entities/grn-item.entity';
import { Stock } from './entities/stock.entity';
import { StockLot, LotSourceType } from './entities/stock-lot.entity';
import {
  StockMovement,
  MovementType,
  ReferenceType,
} from './entities/stock-movement.entity';
import {
  isExpiryInPastEndOfDay,
  normalizeExpiryToEndOfDayUTC,
} from '../common/utils/expiry-date';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchase-orders/entities/purchase-order-item.entity';
import {
  CreateGRNInput,
  UpdateGRNInput,
  GRNFilterInput,
} from './dto/grn.input';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit/services/audit-log.service';
import { AuditAction, AuditEntityType } from '../audit/enums/audit.enums';

@Injectable()
export class GRNService {
  constructor(
    @InjectRepository(GoodsReceiptNote)
    private grnRepository: Repository<GoodsReceiptNote>,
    @InjectRepository(GRNItem)
    private grnItemRepository: Repository<GRNItem>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockLot)
    private stockLotRepository: Repository<StockLot>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
    private dataSource: DataSource,
  ) {}

  /**
   * Generate unique GRN number for a company
   */
  async generateGRNNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.grnRepository.count({
      where: { company_id: companyId },
    });
    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `GRN-${year}-${nextNumber}`;
  }

  /**
   * Get all GRNs with filters
   */
  async getGRNs(
    filters: GRNFilterInput,
    companyId: string,
  ): Promise<GoodsReceiptNote[]> {
    const where: any = { company_id: companyId };

    if (filters.warehouse_id) {
      where.warehouse_id = filters.warehouse_id;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.purchase_order_id) {
      where.purchase_order_id = filters.purchase_order_id;
    }

    if (filters.from_date && filters.to_date) {
      where.received_at = Between(filters.from_date, filters.to_date);
    } else if (filters.from_date) {
      where.received_at = Between(filters.from_date, new Date());
    }

    return this.grnRepository.find({
      where,
      relations: [
        'warehouse',
        'purchase_order',
        'purchase_order.supplier',
        'user',
        'posted_by_user',
        'items',
        'items.product',
        'items.purchase_order_item',
      ],
      order: { created_at: 'DESC' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Get single GRN by ID
   */
  async getGRN(id: string, companyId: string): Promise<GoodsReceiptNote> {
    const grn = await this.grnRepository.findOne({
      where: { id, company_id: companyId },
      relations: [
        'warehouse',
        'purchase_order',
        'purchase_order.supplier',
        'purchase_order.items',
        'purchase_order.items.product',
        'user',
        'posted_by_user',
        'items',
        'items.product',
        'items.purchase_order_item',
      ],
    });

    if (!grn) {
      throw new NotFoundException('GRN not found');
    }

    return grn;
  }

  /**
   * Create new GRN (DRAFT status)
   */
  async createGRN(
    input: CreateGRNInput,
    companyId: string,
    userId: string,
    userRole?: string,
  ): Promise<GoodsReceiptNote> {
    // Validate PO exists and is ORDERED
    const po = await this.purchaseOrderRepository.findOne({
      where: { id: input.purchase_order_id, company_id: companyId },
      relations: ['items', 'items.product'],
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== PurchaseOrderStatus.ORDERED) {
      throw new BadRequestException(
        'Can only create GRN for ORDERED purchase orders',
      );
    }

    // Validate warehouse matches PO
    if (po.warehouse_id !== input.warehouse_id) {
      throw new BadRequestException(
        'Warehouse must match purchase order warehouse',
      );
    }

    // Validate received quantities
    for (const item of input.items) {
      if (item.received_quantity <= 0) {
        throw new BadRequestException(
          'Received quantity must be greater than 0',
        );
      }

      // Find corresponding PO item
      const poItem = po.items.find((i) => i.id === item.purchase_order_item_id);
      if (!poItem) {
        throw new BadRequestException(
          `Invalid purchase order item: ${item.purchase_order_item_id}`,
        );
      }

      // Calculate remaining quantity
      const remainingQty =
        poItem.ordered_quantity - (poItem.received_quantity || 0);
      if (item.received_quantity > remainingQty) {
        throw new BadRequestException(
          `Cannot receive ${item.received_quantity} of ${poItem.product.name}. Only ${remainingQty} remaining.`,
        );
      }
    }

    // Generate GRN number
    const grnNumber = await this.generateGRNNumber(companyId);

    // Create GRN
    const grn = this.grnRepository.create({
      company_id: companyId,
      warehouse_id: input.warehouse_id,
      purchase_order_id: input.purchase_order_id,
      grn_number: grnNumber,
      status: GRNStatus.DRAFT,
      received_at: input.received_at || new Date(),
      notes: input.notes,
      created_by: userId,
      user_role: userRole,
    });

    await this.grnRepository.save(grn);

    // Create GRN items
    const items = input.items.map((itemInput) => {
      const poItem = po.items.find(
        (i) => i.id === itemInput.purchase_order_item_id,
      );
      if (!poItem) {
        throw new BadRequestException(
          `Invalid purchase order item: ${itemInput.purchase_order_item_id}`,
        );
      }

      // Validate expiry date if provided
      if (
        itemInput.expiry_date &&
        isExpiryInPastEndOfDay(itemInput.expiry_date)
      ) {
        throw new BadRequestException('Expiry date cannot be in the past');
      }

      return this.grnItemRepository.create({
        goods_receipt_note_id: grn.id,
        purchase_order_item_id: itemInput.purchase_order_item_id,
        product_id: poItem.product_id,
        received_quantity: itemInput.received_quantity,
        expiry_date: itemInput.expiry_date
          ? normalizeExpiryToEndOfDayUTC(itemInput.expiry_date)
          : undefined,
      });
    });

    await this.grnItemRepository.save(items);

    // Return complete GRN
    return this.getGRN(grn.id, companyId);
  }

  /**
   * Update GRN (DRAFT only)
   */
  async updateGRN(
    id: string,
    input: UpdateGRNInput,
    companyId: string,
  ): Promise<GoodsReceiptNote> {
    const grn = await this.getGRN(id, companyId);

    if (grn.status !== GRNStatus.DRAFT) {
      throw new BadRequestException('Can only edit DRAFT GRNs');
    }

    // Update basic fields
    if (input.received_at) {
      grn.received_at = input.received_at;
    }

    if (input.notes !== undefined) {
      grn.notes = input.notes;
    }

    await this.grnRepository.save(grn);

    // Update items if provided
    if (input.items) {
      // Load PO to validate
      const po = await this.purchaseOrderRepository.findOne({
        where: { id: grn.purchase_order_id },
        relations: ['items', 'items.product'],
      });

      if (!po) {
        throw new NotFoundException('Purchase order not found');
      }

      // Validate new quantities
      for (const item of input.items) {
        if (item.received_quantity <= 0) {
          throw new BadRequestException(
            'Received quantity must be greater than 0',
          );
        }

        const poItem = po.items.find(
          (i) => i.id === item.purchase_order_item_id,
        );
        if (!poItem) {
          throw new BadRequestException(
            `Invalid purchase order item: ${item.purchase_order_item_id}`,
          );
        }

        const remainingQty =
          poItem.ordered_quantity - (poItem.received_quantity || 0);
        if (item.received_quantity > remainingQty) {
          throw new BadRequestException(
            `Cannot receive ${item.received_quantity} of ${poItem.product.name}. Only ${remainingQty} remaining.`,
          );
        }
      }

      // Delete existing items
      await this.grnItemRepository.delete({ goods_receipt_note_id: grn.id });

      // Create new items
      const newItems = input.items.map((itemInput) => {
        const poItem = po.items.find(
          (i) => i.id === itemInput.purchase_order_item_id,
        );
        if (!poItem) {
          throw new BadRequestException(
            `Invalid purchase order item: ${itemInput.purchase_order_item_id}`,
          );
        }

        // Validate expiry date if provided
        if (
          itemInput.expiry_date &&
          isExpiryInPastEndOfDay(itemInput.expiry_date)
        ) {
          throw new BadRequestException('Expiry date cannot be in the past');
        }

        return this.grnItemRepository.create({
          goods_receipt_note_id: grn.id,
          purchase_order_item_id: itemInput.purchase_order_item_id,
          product_id: poItem.product_id,
          received_quantity: itemInput.received_quantity,
          expiry_date: itemInput.expiry_date
            ? normalizeExpiryToEndOfDayUTC(itemInput.expiry_date)
            : undefined,
        });
      });

      await this.grnItemRepository.save(newItems);
    }

    return this.getGRN(grn.id, companyId);
  }

  /**
   * Post GRN (Updates stock - ATOMIC TRANSACTION)
   */
  async postGRN(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<GoodsReceiptNote> {
    const grn = await this.getGRN(id, companyId);

    if (grn.status !== GRNStatus.DRAFT) {
      throw new BadRequestException('Can only post DRAFT GRNs');
    }

    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // For each GRN item, create stock lot, update stock, and create movement
      for (const item of grn.items) {
        // Validate expiry date if provided
        if (item.expiry_date && isExpiryInPastEndOfDay(item.expiry_date)) {
          throw new BadRequestException(
            `Expiry date for ${item.product.name} cannot be in the past`,
          );
        }

        // Create stock lot
        const lot = queryRunner.manager.create(StockLot, {
          company_id: grn.company_id,
          warehouse_id: grn.warehouse_id,
          product_id: item.product_id,
          quantity: Math.floor(Number(item.received_quantity)),
          expiry_date: item.expiry_date
            ? normalizeExpiryToEndOfDayUTC(item.expiry_date)
            : undefined,
          received_at: grn.received_at,
          source_type: LotSourceType.GRN,
          source_id: grn.id,
        });

        await queryRunner.manager.save(StockLot, lot);

        // Find or create stock entry (aggregated view)
        let stock = await queryRunner.manager.findOne(Stock, {
          where: {
            warehouse_id: grn.warehouse_id,
            product_id: item.product_id,
          },
        });

        const previousQty = stock ? Number(stock.quantity) : 0;

        if (!stock) {
          // Create new stock entry
          stock = queryRunner.manager.create(Stock, {
            warehouse_id: grn.warehouse_id,
            product_id: item.product_id,
            company_id: grn.company_id,
            quantity: Math.floor(Number(item.received_quantity)),
            min_stock_level: 0,
            max_stock_level: 1000,
            reorder_point: 10,
          });
        } else {
          // Update existing stock (aggregate from lots)
          stock.quantity = Math.floor(
            Number(stock.quantity) + Number(item.received_quantity),
          );
        }

        await queryRunner.manager.save(Stock, stock);

        // Create stock movement linked to lot
        const movement = queryRunner.manager.create(StockMovement, {
          stock_id: stock.id,
          lot_id: lot.id, // Link to lot
          company_id: grn.company_id,
          warehouse_id: grn.warehouse_id,
          product_id: item.product_id,
          type: MovementType.IN,
          quantity: Math.floor(item.received_quantity),
          previous_quantity: Math.floor(previousQty),
          new_quantity: Math.floor(stock.quantity),
          reference_type: ReferenceType.GRN,
          reference_id: grn.id,
          performed_by: userId,
          user_role: grn.user_role,
          notes: `Goods received via ${grn.grn_number}${item.expiry_date ? ` (Expires: ${item.expiry_date.toISOString().split('T')[0]})` : ''}`,
        });

        await queryRunner.manager.save(StockMovement, movement);

        // Update PO item received quantity
        const poItem = await queryRunner.manager.findOne(PurchaseOrderItem, {
          where: { id: item.purchase_order_item_id },
        });

        if (poItem) {
          const currentReceived = Math.floor(
            Number(poItem.received_quantity) || 0,
          );
          const newReceived = Math.floor(Number(item.received_quantity));
          poItem.received_quantity = currentReceived + newReceived;
          await queryRunner.manager.save(PurchaseOrderItem, poItem);
        }
      }

      // Check if PO is fully received
      const po = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { id: grn.purchase_order_id },
        relations: ['items'],
      });

      if (po) {
        const fullyReceived = po.items.every(
          (item) =>
            Math.floor(item.received_quantity) >=
            Math.floor(item.ordered_quantity),
        );

        if (fullyReceived) {
          po.status = PurchaseOrderStatus.CLOSED;
          await queryRunner.manager.save(PurchaseOrder, po);
        }
      }

      // Update GRN status
      grn.status = GRNStatus.POSTED;
      grn.posted_by = userId;
      grn.posted_at = new Date();
      await queryRunner.manager.save(GoodsReceiptNote, grn);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Notify users about posted GRN (async, don't block)
      const result = await this.getGRN(id, companyId);
      this.notificationsService
        .notifyGRNPosted(
          grn.company_id,
          [userId], // Add more users as needed
          result.id,
          result.grn_number,
        )
        .catch((err) => console.error('Failed to send notification:', err));

      // Record audit log (fire-and-forget)
      try {
        await this.auditLogService.record({
          companyId: grn.company_id,
          actor: {
            id: userId,
            email: result.user?.email || 'unknown',
            role: result.user_role || 'STAFF', // Pass as string
          },
          action: AuditAction.GRN_POSTED,
          entityType: AuditEntityType.GRN,
          entityId: grn.id,
          metadata: {
            grnNumber: grn.grn_number,
            warehouseName: result.warehouse?.name,
            warehouseSlug: (result as any).warehouse?.slug,
            itemCount: grn.items?.length || 0,
            poNumber: result.purchase_order?.po_number,
          },
        });
      } catch (err) {
        // Fire-and-forget: Log error but don't break main flow
        console.error('Failed to record audit log for GRN posting:', err);
      }

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
   * Cancel GRN (DRAFT only, OWNER/ADMIN only)
   */
  async cancelGRN(id: string, companyId: string): Promise<GoodsReceiptNote> {
    const grn = await this.getGRN(id, companyId);

    if (grn.status !== GRNStatus.DRAFT) {
      throw new BadRequestException('Can only cancel DRAFT GRNs');
    }

    grn.status = GRNStatus.CANCELLED;
    await this.grnRepository.save(grn);

    return this.getGRN(grn.id, companyId);
  }
}
