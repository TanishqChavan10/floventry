import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Transaction, TransactionStatus } from '../transaction/transaction.entity';
import { Shipment } from '../supplier/shipment.entity';
import { Product } from '../inventory/product/product.entity';
import { Supplier } from '../supplier/supplier.entity';
import { Customer } from '../transaction/customer.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(Shipment)
        private shipmentRepository: Repository<Shipment>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Supplier)
        private supplierRepository: Repository<Supplier>,
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
    ) { }

    async getSalesReport(startDate: Date, endDate: Date, userId: string) {
        const transactions = await this.transactionRepository.find({
            where: {
                transaction_date: Between(startDate, endDate),
                userId,
                status: TransactionStatus.COMPLETED,
            },
            relations: ['items', 'items.product', 'customer'],
            order: { transaction_date: 'ASC' },
        });

        const totalRevenue = transactions.reduce(
            (sum, t) => sum + Number(t.total_amount),
            0,
        );
        const totalOrders = transactions.length;

        // Group by date for chart
        const salesByDate = {};
        transactions.forEach((t) => {
            const date = t.transaction_date.toISOString().split('T')[0];
            salesByDate[date] = (salesByDate[date] || 0) + Number(t.total_amount);
        });

        // Top selling products
        const productSales = {};
        transactions.forEach((t) => {
            t.items.forEach((item) => {
                const pName = item.product?.product_name || 'Unknown';
                productSales[pName] = (productSales[pName] || 0) + item.quantity;
            });
        });

        const topProducts = Object.entries(productSales)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => (b.qty as number) - (a.qty as number))
            .slice(0, 5);

        return {
            summary: { totalRevenue, totalOrders },
            chartData: Object.entries(salesByDate).map(([date, amount]) => ({
                date,
                amount,
            })),
            topProducts,
            transactions,
        };
    }

    async getPurchaseReport(startDate: Date, endDate: Date, userId: string) {
        const shipments = await this.shipmentRepository.find({
            where: {
                received_date: Between(startDate, endDate),
                userId,
            },
            relations: ['supplier', 'shipmentItems'],
            order: { received_date: 'ASC' },
        });

        const totalSpent = shipments.reduce(
            (sum, s) => sum + Number(s.invoice_amt),
            0,
        );
        const totalShipments = shipments.length;

        return {
            summary: { totalSpent, totalShipments },
            shipments,
        };
    }

    async getInventoryReport(userId: string) {
        const products = await this.productRepository.find({
            where: { userId },
            relations: ['categories'],
        });

        const totalStockValue = products.reduce(
            (sum, p) => sum + Number(p.default_price) * p.stock,
            0,
        );

        const lowStockItems = products.filter((p) => p.stock <= p.min_stock);
        const outOfStockItems = products.filter((p) => p.stock === 0);

        return {
            summary: {
                totalItems: products.length,
                totalStockValue,
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStockItems.length,
            },
            lowStockItems,
            allProducts: products,
        };
    }

    async getSupplierPerformance(userId: string) {
        const suppliers = await this.supplierRepository.find({
            where: { userId },
            relations: ['shipments'],
        });

        const performance = suppliers.map((s) => {
            const totalShipments = s.shipments.length;
            const totalSpent = s.shipments.reduce(
                (sum, sh) => sum + Number(sh.invoice_amt),
                0,
            );

            return {
                supplierName: s.name,
                totalShipments,
                totalSpent,
                // Mocking delivery time/quality for now as we don't have that data explicitly
                averageDeliveryTime: 'N/A',
            };
        });

        return performance;
    }
}
