import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bwipjs from 'bwip-js';
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { BarcodeLabelLayout } from './dto/generate-barcode-labels.input';

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

  private stripControlChars(value: string): string {
    return value.replace(/[\x00-\x1F\x7F]/g, '');
  }

  private removeAllWhitespace(value: string): string {
    return value.replace(/\s+/g, '');
  }

  private normalizeBarcode(raw?: string | null): string | null {
    if (raw === undefined || raw === null) return null;
    const noControls = this.stripControlChars(raw);
    const noWhitespace = this.removeAllWhitespace(noControls).trim();
    if (!noWhitespace) return null;

    // Canonicalize non-EAN values to uppercase for consistent rendering.
    if (!/^\d{13}$/.test(noWhitespace)) {
      return noWhitespace.toUpperCase();
    }

    return noWhitespace;
  }

  private isValidEan13Checksum(ean13: string): boolean {
    if (!/^\d{13}$/.test(ean13)) return false;

    const digits = ean13.split('').map((c) => Number(c));
    const checkDigit = digits[12];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const isEvenPosition = (i + 1) % 2 === 0;
      sum += digits[i] * (isEvenPosition ? 3 : 1);
    }

    const computed = (10 - (sum % 10)) % 10;
    return computed === checkDigit;
  }

  private chooseBarcodeFormat(barcode: string): { bcid: 'code128' | 'ean13' } {
    const isDigitsOnly = /^\d+$/.test(barcode);
    if (isDigitsOnly && barcode.length === 13) {
      if (!this.isValidEan13Checksum(barcode)) {
        throw new BadRequestException('Invalid EAN-13 checksum');
      }
      return { bcid: 'ean13' };
    }
    return { bcid: 'code128' };
  }

  private async renderBarcodePng(
    barcodeValue: string,
    opts?: {
      scale?: number;
      height?: number;
    },
  ): Promise<Buffer> {
    const normalized = this.normalizeBarcode(barcodeValue);
    if (!normalized) {
      throw new BadRequestException('Barcode is required');
    }

    const { bcid } = this.chooseBarcodeFormat(normalized);

    return bwipjs.toBuffer({
      bcid,
      text: normalized,
      scale: opts?.scale ?? 3,
      height: opts?.height ?? 12,
      includetext: false,
      backgroundcolor: 'FFFFFF',
    });
  }

  private mmToPt(mm: number): number {
    return (mm / 25.4) * 72;
  }

  private renderA4SingleLabel(args: {
    doc: InstanceType<typeof PDFDocument>;
    product: BarcodeLabelProduct;
    barcodeValue: string;
    barcodePng: Buffer;
  }): void {
    const { doc, product, barcodeValue, barcodePng } = args;

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const contentWidth =
      pageWidth - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    const top = doc.page.margins.top;

    doc
      .fontSize(20)
      .fillColor('#111827')
      .text(product.name || 'Product', left, top, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .moveDown(0.5)
      .fontSize(12)
      .fillColor('#374151')
      .text(`SKU: ${product.sku ?? '—'}`, {
        width: contentWidth,
        align: 'center',
      });

    const barcodeWidth = Math.min(360, contentWidth);
    const barcodeX = left + (contentWidth - barcodeWidth) / 2;
    const barcodeY = doc.y + 30;

    doc.image(barcodePng, barcodeX, barcodeY, {
      width: barcodeWidth,
    });

    doc
      .fontSize(14)
      .fillColor('#111827')
      .text(barcodeValue, left, barcodeY + 110, {
        width: contentWidth,
        align: 'center',
      });

    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('Barcode labels are visual aids only.', left, pageHeight - 70, {
        width: contentWidth,
        align: 'center',
      });
  }

  private renderA4GridLabelCell(args: {
    doc: InstanceType<typeof PDFDocument>;
    x: number;
    y: number;
    width: number;
    height: number;
    product: BarcodeLabelProduct;
    barcodeValue: string;
    barcodePng: Buffer;
  }): void {
    const { doc, x, y, width, height, product, barcodeValue, barcodePng } =
      args;

    const padding = 6;
    const innerX = x + padding;
    const innerY = y + padding;
    const innerW = Math.max(0, width - padding * 2);
    const innerH = Math.max(0, height - padding * 2);

    // Title
    const titleFontSize = innerH < 90 ? 7 : 8;
    doc
      .fontSize(titleFontSize)
      .fillColor('#111827')
      .text(product.name || 'Product', innerX, innerY, {
        width: innerW,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
      });

    // SKU
    doc
      .fontSize(7)
      .fillColor('#374151')
      .text(product.sku ?? '—', innerX, innerY + 12, {
        width: innerW,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
      });

    // Barcode image
    const imageTop = innerY + 24;
    const imageMaxH = Math.max(20, innerH - 24 - 14);
    const imageW = innerW;

    // We control bwip height/scale elsewhere; here we just fit width.
    doc.image(barcodePng, innerX, imageTop, {
      width: imageW,
    });

    // Barcode text
    const valueY = y + height - padding - 10;
    const valueFontSize = barcodeValue.length > 18 ? 6 : 7;
    doc
      .fontSize(valueFontSize)
      .fillColor('#111827')
      .text(barcodeValue, innerX, valueY, {
        width: innerW,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
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
    layout?: BarcodeLabelLayout;
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

    const layout = params.layout ?? BarcodeLabelLayout.A4_SINGLE;

    const isThermal = layout === BarcodeLabelLayout.THERMAL_50X25;
    const thermalSize: [number, number] = [this.mmToPt(50), this.mmToPt(25)];

    const doc = new PDFDocument({
      size: isThermal ? thermalSize : 'A4',
      margin: isThermal ? 8 : 24,
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

    if (layout === BarcodeLabelLayout.A4_SINGLE) {
      for (const product of products) {
        doc.addPage();

        const barcodeValue = this.normalizeBarcode(product.barcode)!;
        const barcodePng = await this.renderBarcodePng(barcodeValue, {
          scale: 3,
          height: 12,
        });

        this.renderA4SingleLabel({
          doc,
          product,
          barcodeValue,
          barcodePng,
        });
      }
    } else if (
      layout === BarcodeLabelLayout.A4_2X4 ||
      layout === BarcodeLabelLayout.A4_3X8
    ) {
      const cols = layout === BarcodeLabelLayout.A4_2X4 ? 2 : 3;
      const rows = layout === BarcodeLabelLayout.A4_2X4 ? 4 : 8;
      const perPage = cols * rows;

      let pageIndex = 0;
      while (pageIndex * perPage < products.length) {
        doc.addPage();

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const left = doc.page.margins.left;
        const top = doc.page.margins.top;
        const contentWidth =
          pageWidth - doc.page.margins.left - doc.page.margins.right;
        const contentHeight =
          pageHeight - doc.page.margins.top - doc.page.margins.bottom;

        const cellW = contentWidth / cols;
        const cellH = contentHeight / rows;

        const start = pageIndex * perPage;
        const end = Math.min(products.length, start + perPage);
        const slice = products.slice(start, end);

        for (let i = 0; i < slice.length; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const x = left + c * cellW;
          const y = top + r * cellH;

          const product = slice[i];
          const barcodeValue = this.normalizeBarcode(product.barcode)!;
          const barcodePng = await this.renderBarcodePng(barcodeValue, {
            scale: layout === BarcodeLabelLayout.A4_3X8 ? 2 : 2,
            height: layout === BarcodeLabelLayout.A4_3X8 ? 8 : 10,
          });

          this.renderA4GridLabelCell({
            doc,
            x,
            y,
            width: cellW,
            height: cellH,
            product,
            barcodeValue,
            barcodePng,
          });
        }

        pageIndex++;
      }
    } else if (layout === BarcodeLabelLayout.THERMAL_50X25) {
      for (const product of products) {
        doc.addPage();

        const barcodeValue = this.normalizeBarcode(product.barcode)!;
        const barcodePng = await this.renderBarcodePng(barcodeValue, {
          scale: 2,
          height: 10,
        });

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        const left = doc.page.margins.left;
        const top = doc.page.margins.top;
        const contentWidth =
          pageWidth - doc.page.margins.left - doc.page.margins.right;
        const contentHeight =
          pageHeight - doc.page.margins.top - doc.page.margins.bottom;

        // Name (small)
        doc
          .fontSize(7)
          .fillColor('#111827')
          .text(product.name || 'Product', left, top, {
            width: contentWidth,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
          });

        // Barcode image
        const imageY = top + 10;
        doc.image(barcodePng, left, imageY, { width: contentWidth });

        // Value at bottom
        doc
          .fontSize(7)
          .fillColor('#111827')
          .text(barcodeValue, left, top + contentHeight - 10, {
            width: contentWidth,
            align: 'center',
            lineBreak: false,
            ellipsis: true,
          });
      }
    } else {
      throw new BadRequestException('Unsupported label layout');
    }

    doc.end();
    return endPromise;
  }
}
