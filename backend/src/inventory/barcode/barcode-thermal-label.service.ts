import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { BarcodeService } from './barcode.service';

export type ThermalLabelSize = '2x1' | '50x25mm' | '4x6';

@Injectable()
export class BarcodeThermalLabelService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly barcodeService: BarcodeService,
  ) {}

  private getLabelDots(size: ThermalLabelSize): { width: number; height: number } {
    // Assume 203dpi printers (common Zebra/TSC).
    // 4x6 inch at 203dpi: 812 x 1218 dots.
    if (size === '4x6') {
      return { width: 812, height: 1218 };
    }
    if (size === '50x25mm') {
      return { width: 400, height: 200 };
    }
    return { width: 406, height: 203 };
  }

  private escapeZplText(text: string): string {
    // Minimal escaping: ZPL uses ^ and ~ as control chars.
    return (text ?? '').replace(/[\^~]/g, ' ');
  }

  private chooseBarcodeZpl(barcodeValue: string): { command: string; human: boolean } {
    // EAN-13: ^BE, Code128: ^BC
    if (/^\d{13}$/.test(barcodeValue)) {
      return { command: '^BEN,60,Y,N', human: true };
    }
    return { command: '^BCN,60,Y,N,N', human: true };
  }

  private formatPrintedOn(d = new Date()): string {
    // YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generateZpl(params: {
    companyId: string;
    productIds: string[];
    copies: number;
    labelSize: ThermalLabelSize;
  }): Promise<string> {
    const copies = Number(params.copies ?? 1);
    if (!Number.isFinite(copies) || copies < 1 || copies > 100) {
      throw new BadRequestException('copies must be between 1 and 100');
    }

    const labelSize = (params.labelSize ?? '2x1') as ThermalLabelSize;
    const dots = this.getLabelDots(labelSize);

    const products = await this.productRepository.find({
      where: params.productIds.map((id) => ({ id, company_id: params.companyId })),
    });

    if (!products.length) {
      throw new NotFoundException('No products found');
    }

    const byId = new Map(products.map((p) => [p.id, p] as const));

    const chunks: string[] = [];
    for (const productId of params.productIds) {
      const product = byId.get(productId);
      if (!product) continue;

      const barcode = this.barcodeService.normalizeBarcode(product.barcode);
      if (!barcode) {
        continue;
      }

      const name = this.escapeZplText(product.name || 'Product');
      const sku = this.escapeZplText(product.sku || '');

      const printedOn = this.formatPrintedOn(new Date());
      const warehouseName = '—';

      // Your requested ZPL template is effectively a 4x6" label.
      // Keep the old compact templates for the smaller sizes.
      const useLargeTemplate = labelSize === '4x6';

      for (let i = 0; i < copies; i++) {
        if (useLargeTemplate) {
          chunks.push(
            [
              '^XA',
              `^PW${dots.width}`,
              `^LL${dots.height}`,
              '^CI28',
              '',
              '^FX ================= HEADER SECTION =================',
              '^CF0,60',
              '^FO50,40^FDFlowventory^FS',
              '^CF0,30',
              '^FO50,110^FDProduct Label^FS',
              '^FO50,150^GB700,3,3^FS',
              '',
              '^FX ================= PRODUCT INFO SECTION =================',
              '^CF0,40',
              '^FO50,200^FDProduct:^FS',
              '^CF0,35',
              `^FO250,200^FD${name}^FS`,
              '',
              '^CF0,40',
              '^FO50,260^FDSKU:^FS',
              '^CF0,35',
              `^FO250,260^FD${sku}^FS`,
              '',
              '^FO50,320^GB700,3,3^FS',
              '',
              '^FX ================= BARCODE SECTION =================',
              '^BY3,2,180',
              '^FO150,380^BCN,180,Y,N,N',
              `^FD${barcode}^FS`,
              '',
              '^FO50,600^GB700,3,3^FS',
              '',
              '^FX ================= REFERENCE SECTION =================',
              '^FO50,650^GB700,200,3^FS',
              '^FO400,650^GB3,200,3^FS',
              '',
              '^CF0,40',
              '^FO80,670^FDWarehouse:^FS',
              '^CF0,35',
              `^FO80,720^FD${this.escapeZplText(warehouseName)}^FS`,
              '',
              '^CF0,40',
              '^FO80,760^FDPrinted On:^FS',
              '^CF0,35',
              `^FO80,800^FD${this.escapeZplText(printedOn)}^FS`,
              '',
              '^CF0,160',
              '^FO500,700^FDFC^FS',
              '',
              '^XZ',
            ].join('\n'),
          );
          continue;
        }

        const { command } = this.chooseBarcodeZpl(barcode);
        chunks.push(
          [
            '^XA',
            `^PW${dots.width}`,
            `^LL${dots.height}`,
            '^CI28',
            // Product name
            '^FO10,10^A0N,24,24',
            `^FD${name}^FS`,
            // SKU
            '^FO10,38^A0N,18,18',
            `^FD${sku ? `SKU: ${sku}` : ''}^FS`,
            // Barcode
            '^FO10,60',
            command,
            `^FD${barcode}^FS`,
            '^XZ',
          ].join('\n'),
        );
      }
    }

    if (!chunks.length) {
      throw new BadRequestException('No printable barcodes found for the selection');
    }

    return chunks.join('\n');
  }
}
