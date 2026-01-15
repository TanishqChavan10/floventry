import { Repository } from 'typeorm';
import { Stock } from '../../src/inventory/entities/stock.entity';
import { StockLot } from '../../src/inventory/entities/stock-lot.entity';
import { StockMovement } from '../../src/inventory/entities/stock-movement.entity';
import { Notification, NotificationType } from '../../src/notifications/entities/notification.entity';

/**
 * Assertion helpers for inventory tests
 * Provides reusable assertions for common inventory validation scenarios
 */
export class InventoryAssertions {
    /**
     * Assert that a stock lot exists with expected properties
     */
    static async assertStockLotExists(
        lotRepository: Repository<StockLot>,
        lotId: string,
        expectations: Partial<StockLot>,
    ): Promise<void> {
        const lot = await lotRepository.findOne({ where: { id: lotId } });

        expect(lot).toBeDefined();
        if (!lot) return;

        if (expectations.quantity !== undefined) {
            expect(lot.quantity).toBe(expectations.quantity);
        }

        if (expectations.expiry_date !== undefined) {
            if (expectations.expiry_date === null) {
                expect(lot.expiry_date).toBeNull();
            } else {
                expect(lot.expiry_date?.getTime()).toBe(expectations.expiry_date.getTime());
            }
        }

        if (expectations.source_type !== undefined) {
            expect(lot.source_type).toBe(expectations.source_type);
        }
    }

    /**
     * Assert stock aggregate quantity
     */
    static async assertStockQuantity(
        stockRepository: Repository<Stock>,
        stockId: string,
        expectedQty: number,
    ): Promise<void> {
        const stock = await stockRepository.findOne({ where: { id: stockId } });
        expect(stock).toBeDefined();
        if (!stock) return;
        expect(parseFloat(stock.quantity.toString())).toBe(expectedQty);
    }

    /**
     * Assert lot quantity
     */
    static async assertLotQuantity(
        lotRepository: Repository<StockLot>,
        lotId: string,
        expectedQty: number,
    ): Promise<void> {
        const lot = await lotRepository.findOne({ where: { id: lotId } });
        expect(lot).toBeDefined();
        if (!lot) return;
        expect(parseFloat(lot.quantity.toString())).toBe(expectedQty);
    }

    /**
     * Assert that stock quantity equals sum of lot quantities (invariant)
     */
    static async assertStockLotsInvariant(
        stockRepository: Repository<Stock>,
        lotRepository: Repository<StockLot>,
        stockId: string,
    ): Promise<void> {
        const stock = await stockRepository.findOne({ where: { id: stockId } });
        expect(stock).toBeDefined();
        if (!stock) return;

        const lots = await lotRepository.find({
            where: {
                product_id: stock.product_id,
                warehouse_id: stock.warehouse_id,
            }
        });

        const stockQty = parseFloat(stock.quantity.toString());
        const lotsSum = lots.reduce((sum, lot) => sum + parseFloat(lot.quantity.toString()), 0);

        expect(stockQty).toBe(lotsSum);
    }

    /**
     * Assert that a stock movement was created
     */
    static async assertStockMovementCreated(
        movementRepository: Repository<StockMovement>,
        params: {
            warehouseId: string;
            productId: string;
            type: string;
        },
    ): Promise<StockMovement | null> {
        const movement = await movementRepository.findOne({
            where: {
                warehouse_id: params.warehouseId,
                product_id: params.productId,
                type: params.type as any,
            },
            order: { created_at: 'DESC' },
        });

        expect(movement).toBeDefined();
        return movement;
    }

    /**
     * Assert that a notification was created
     */
    static async assertNotificationCreated(
        notificationRepository: Repository<Notification>,
        entityId: string,
        type: NotificationType,
    ): Promise<void> {
        const notification = await notificationRepository.findOne({
            where: {
                entity_id: entityId,
                type,
            },
        });

        expect(notification).toBeDefined();
    }

    /**
     * Assert that NO notification exists
     */
    static async assertNoNotificationExists(
        notificationRepository: Repository<Notification>,
        entityId: string,
        type: NotificationType,
    ): Promise<void> {
        const notification = await notificationRepository.findOne({
            where: {
                entity_id: entityId,
                type,
            },
        });

        expect(notification).toBeNull();
    }
}
