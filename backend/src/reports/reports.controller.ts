import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RestAuthGuard } from '../auth/guards/rest-auth.guard';
import { RestUser } from '../auth/decorators/rest-user.decorator';

@Controller('reports')
@UseGuards(RestAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales')
    async getSalesReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @RestUser() user: any,
    ) {
        return this.reportsService.getSalesReport(
            new Date(startDate),
            new Date(endDate),
            user.clerkId,
        );
    }

    @Get('purchase')
    async getPurchaseReport(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @RestUser() user: any,
    ) {
        return this.reportsService.getPurchaseReport(
            new Date(startDate),
            new Date(endDate),
            user.clerkId,
        );
    }

    @Get('inventory')
    async getInventoryReport(@RestUser() user: any) {
        return this.reportsService.getInventoryReport(user.clerkId);
    }

    @Get('supplier-performance')
    async getSupplierPerformance(@RestUser() user: any) {
        return this.reportsService.getSupplierPerformance(user.clerkId);
    }
}
