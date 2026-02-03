import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bwipjs from 'bwip-js';
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

export type BarcodeLabelProduct = Pick<
  Product,
  'id' | 'name' | 'sku' | 'barcode'
>;

@Injectable()
export class BarcodeLabelService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private normalizeBarcode(raw?: string | null): string | null {
    if (raw === undefined || raw === null) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return trimmed;
  }

  private chooseBarcodeFormat(barcode: string): { bcid: 'code128' | 'ean13' } {
    const isDigitsOnly = /^\d+$/.test(barcode);
    if (isDigitsOnly && barcode.length === 13) {
      return { bcid: 'ean13' };
    }
    return { bcid: 'code128' };
  }

  private async renderBarcodePng(barcodeValue: string): Promise<Buffer> {
    const normalized = this.normalizeBarcode(barcodeValue);
    if (!normalized) {
      throw new BadRequestException('Barcode is required');
    }

    const { bcid } = this.chooseBarcodeFormat(normalized);

    return bwipjs.toBuffer({
      bcid,
      text: normalized,
      scale: 3,
      height: 12,
      includetext: false,
      backgroundcolor: 'FFFFFF',
    });
  }

  private async fetchProductsForCompany(params: {
    companyId: string;
    productIds: string[];
  }): Promise<BarcodeLabelProduct[]> {
    const uniqueIds = Array.from(new Set(params.productIds));
    if (!uniqueIds.length) {
      throw new BadRequestException('At least one productId is required');
    }

    const products = await this.productRepository
      .createQueryBuilder('p')
      .select(['p.id', 'p.name', 'p.sku', 'p.barcode'])
      .where('p.company_id = :companyId', { companyId: params.companyId })
      .andWhere('p.id IN (:...ids)', { ids: uniqueIds })
      .getMany();

    const found = new Set(products.map((p) => p.id));
    const missing = uniqueIds.filter((id) => !found.has(id));
    if (missing.length) {
      throw new NotFoundException('One or more products were not found');
    }

    return products;
  }

  async generateLabelsPdf(params: {
    companyId: string;
    productIds: string[];
  }): Promise<Buffer> {
    const products = await this.fetchProductsForCompany(params);

    const missingBarcode = products.filter(
      (p) => !this.normalizeBarcode(p.barcode),
    );
    if (missingBarcode.length) {
      throw new BadRequestException(
        'One or more products do not have a barcode',
      );
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      autoFirstPage: false,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );

    const endPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    for (const product of products) {
      doc.addPage();

      const barcodeValue = this.normalizeBarcode(product.barcode)!;
      const barcodePng = await this.renderBarcodePng(barcodeValue);

      // Simple single-label layout (one label per page)
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const contentWidth =
        pageWidth - doc.page.margins.left - doc.page.margins.right;
      const left = doc.page.margins.left;
      const top = doc.page.margins.top;

      // Title
      doc
        .fontSize(20)
        .fillColor('#111827')
        .text(product.name || 'Product', left, top, {
          width: contentWidth,
          align: 'center',
        });

      // SKU
      doc
        .moveDown(0.5)
        .fontSize(12)
        .fillColor('#374151')
        .text(`SKU: ${product.sku ?? '—'}`, {
          width: contentWidth,
          align: 'center',
        });

      // Barcode image
      const barcodeWidth = Math.min(360, contentWidth);
      const barcodeX = left + (contentWidth - barcodeWidth) / 2;
      const barcodeY = doc.y + 30;

      doc.image(barcodePng, barcodeX, barcodeY, {
        width: barcodeWidth,
      });

      // Barcode value text
      doc
        .fontSize(14)
        .fillColor('#111827')
        .text(barcodeValue, left, barcodeY + 110, {
          width: contentWidth,
          align: 'center',
        });

      // Footer note (still strictly identity-only)
      doc
        .fontSize(9)
        .fillColor('#6B7280')
        .text('Barcode labels are visual aids only.', left, pageHeight - 70, {
          width: contentWidth,
          align: 'center',
        });
    }

    doc.end();
    return endPromise;
  }
}
