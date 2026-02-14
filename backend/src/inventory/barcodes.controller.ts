import { BadRequestException, Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { Product } from './entities/product.entity';

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  const needsQuotes = /[\n\r,\"]/g.test(s);
  const escaped = s.replace(/\"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

@Controller('barcodes')
@UseGuards(ClerkAuthGuard)
export class BarcodesController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  @Get('export.csv')
  async exportCsv(
    @Req() req: any,
    @Res() res: Response,
    @Query('productIds') productIds?: string,
  ) {
    const companyId = req?.user?.activeCompanyId;
    if (!companyId) {
      throw new BadRequestException('Active company required');
    }

    const ids = (productIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const products = await this.productRepository.find({
      where: ids.length
        ? ids.map((id) => ({ id, company_id: companyId }))
        : { company_id: companyId },
      order: { created_at: 'DESC' },
    });

    const header = ['product_name', 'sku', 'barcode', 'alternate_barcodes'];
    const lines = [header.join(',')];

    for (const p of products) {
      lines.push(
        [
          csvEscape(p.name),
          csvEscape(p.sku),
          csvEscape(p.barcode ?? ''),
          csvEscape(Array.isArray((p as any).alternate_barcodes) ? (p as any).alternate_barcodes.join('|') : ''),
        ].join(','),
      );
    }

    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="barcodes-export.csv"');
    return res.send(csv);
  }
}
