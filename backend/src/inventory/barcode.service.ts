import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductBarcodeUnit, ProductBarcodeUnitType } from './entities/product-barcode-unit.entity';

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductBarcodeUnit)
    private readonly productBarcodeUnitRepository: Repository<ProductBarcodeUnit>,
  ) {}

  private stripControlChars(value: string): string {
    // Remove ASCII control characters (scanner/newline noise).
    return value.replace(/[\x00-\x1F\x7F]/g, '');
  }

  private removeAllWhitespace(value: string): string {
    // Scanners / copy-paste can introduce spaces/newlines.
    return value.replace(/\s+/g, '');
  }

  private looksLikeEan13(value: string): boolean {
    return /^\d{13}$/.test(value);
  }

  private isDigitsOnly(value: string): boolean {
    return /^\d+$/.test(value);
  }

  private isValidEan13Checksum(ean13: string): boolean {
    if (!this.looksLikeEan13(ean13)) return false;

    const digits = ean13.split('').map((c) => Number(c));
    const checkDigit = digits[12];

    let sum = 0;
    // positions 1..12 (1-based): odd weights 1, even weights 3
    for (let i = 0; i < 12; i++) {
      const isEvenPosition = (i + 1) % 2 === 0;
      sum += digits[i] * (isEvenPosition ? 3 : 1);
    }

    const computed = (10 - (sum % 10)) % 10;
    return computed === checkDigit;
  }

  private canonicalizeForStorage(raw: string): string {
    const noControls = this.stripControlChars(raw);
    const noWhitespace = this.removeAllWhitespace(noControls).trim();
    if (!noWhitespace) return '';

    // Canonicalize Code128-ish values to uppercase to tolerate scanner casing.
    if (!this.looksLikeEan13(noWhitespace)) {
      return noWhitespace.toUpperCase();
    }

    return noWhitespace;
  }

  private canonicalizeForScan(raw: string): string {
    const noControls = this.stripControlChars(raw);
    const noWhitespace = this.removeAllWhitespace(noControls).trim();
    if (!noWhitespace) return '';

    if (!this.looksLikeEan13(noWhitespace)) {
      return noWhitespace.toUpperCase();
    }

    return noWhitespace;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeCompanyBarcodePrefix(prefix: string): string {
    const cleaned = prefix.replace(/\s+/g, '').toUpperCase();
    const safe = cleaned.replace(/[^A-Z0-9]/g, '');
    if (!safe) return 'FLO';
    return safe.slice(0, 6);
  }

  private formatCompanySequenceBarcode(prefix: string, sequence: number): string {
    const num = String(Math.max(0, Math.floor(sequence))).padStart(6, '0');
    return `${prefix}-${num}`;
  }

  private async getMaxCompanySequenceForPrefix(params: {
    companyId: string;
    prefix: string;
  }): Promise<number> {
    const prefix = this.normalizeCompanyBarcodePrefix(params.prefix);
    const escaped = this.escapeRegExp(prefix);
    const fullRegex = `^${escaped}-[0-9]{6}$`;
    const tailRegex = '[0-9]{6}$';
    const like = `${prefix}-%`;

    const productRaw = await this.productRepository
      .createQueryBuilder('p')
      .select('MAX(CAST(SUBSTRING(p.barcode from :tailRegex) AS INTEGER))', 'max')
      .where('p.company_id = :companyId', { companyId: params.companyId })
      .andWhere('p.barcode LIKE :like', { like })
      .andWhere('p.barcode ~ :fullRegex', { fullRegex })
      .setParameter('tailRegex', tailRegex)
      .getRawOne<{ max: string | number | null }>();

    const unitRaw = await this.productBarcodeUnitRepository
      .createQueryBuilder('u')
      .select('MAX(CAST(SUBSTRING(u.barcode_value from :tailRegex) AS INTEGER))', 'max')
      .where('u.company_id = :companyId', { companyId: params.companyId })
      .andWhere('u.barcode_value LIKE :like', { like })
      .andWhere('u.barcode_value ~ :fullRegex', { fullRegex })
      .setParameter('tailRegex', tailRegex)
      .getRawOne<{ max: string | number | null }>();

    const pMax = productRaw?.max ? Number(productRaw.max) : 0;
    const uMax = unitRaw?.max ? Number(unitRaw.max) : 0;

    return Math.max(Number.isFinite(pMax) ? pMax : 0, Number.isFinite(uMax) ? uMax : 0);
  }

  /**
   * Generates a short, readable barcode unique per company.
   * Format: PREFIX-000001 (6 digits)
   *
   * Notes:
   * - Uniqueness is enforced across products (active/inactive), alternates, and packaging barcodes.
   * - Uses retry strategy to reduce collision risk under concurrent creation.
   */
  async generateUniqueBarcode(companyId: string, prefix = 'FLO'): Promise<string> {
    const normalizedPrefix = this.normalizeCompanyBarcodePrefix(prefix);
    const max = await this.getMaxCompanySequenceForPrefix({
      companyId,
      prefix: normalizedPrefix,
    });

    // Try sequentially from max+1 upward.
    const start = Math.max(0, Math.floor(max)) + 1;
    for (let i = 0; i < 250; i++) {
      const candidate = this.formatCompanySequenceBarcode(normalizedPrefix, start + i);
      try {
        const normalized = await this.normalizeAndValidateForCompany({
          companyId,
          barcode: candidate,
          alternateBarcodes: null,
        });
        if (normalized.barcode) return normalized.barcode;
      } catch {
        // try next
      }
    }

    throw new BadRequestException('Failed to auto-generate a unique barcode');
  }

  normalizeBarcode(raw?: string | null): string | null {
    if (raw === undefined || raw === null) return null;
    const canonical = this.canonicalizeForStorage(raw);
    if (!canonical) return null;
    return canonical;
  }

  normalizeBarcodeList(raw?: Array<string | null> | null): string[] | null {
    if (!raw) return null;

    const normalized: string[] = [];
    const seen = new Set<string>();

    for (const item of raw) {
      const value = this.normalizeBarcode(item);
      if (!value) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      normalized.push(value);
    }

    return normalized.length ? normalized : null;
  }

  /**
   * Normalizes + validates barcode and alternate_barcodes and ensures company-level uniqueness.
   *
   * Notes:
   * - Uniqueness is enforced across *all* products in the company (active or inactive),
   *   to prevent re-use collisions if items are re-activated.
   */
  async normalizeAndValidateForCompany(params: {
    companyId: string;
    barcode?: string | null;
    alternateBarcodes?: Array<string | null> | null;
    excludeProductId?: string;
    excludeBarcodeUnitId?: string;
  }): Promise<{ barcode: string | null; alternate_barcodes: string[] | null }> {
    const barcode = this.normalizeBarcode(params.barcode);
    const alternate_barcodes = this.normalizeBarcodeList(
      params.alternateBarcodes,
    );

    const allToValidate = [barcode, ...(alternate_barcodes ?? [])].filter(
      (b): b is string => typeof b === 'string' && b.length > 0,
    );

    for (const b of allToValidate) {
      if (b.length > 100) {
        throw new BadRequestException(
          'Barcode must be less than 100 characters',
        );
      }

      // If it looks like EAN-13, enforce checksum validity.
      if (this.looksLikeEan13(b) && !this.isValidEan13Checksum(b)) {
        throw new BadRequestException('Invalid EAN-13 checksum');
      }

      // Prevent accidental "EAN with letters" after normalization.
      if (b.length === 13 && !this.isDigitsOnly(b)) {
        throw new BadRequestException('EAN-13 barcodes must be numeric');
      }
    }

    if (barcode && alternate_barcodes?.includes(barcode)) {
      throw new BadRequestException(
        'Primary barcode cannot also appear in alternate barcodes',
      );
    }

    const allBarcodes = [barcode, ...(alternate_barcodes ?? [])].filter(
      (b): b is string => typeof b === 'string' && b.length > 0,
    );

    if (allBarcodes.length) {
      await this.assertCompanyBarcodeUniqueness({
        companyId: params.companyId,
        barcodes: allBarcodes,
        excludeProductId: params.excludeProductId,
        excludeBarcodeUnitId: params.excludeBarcodeUnitId,
      });
    }

    return { barcode, alternate_barcodes };
  }

  async assertCompanyBarcodeUniqueness(params: {
    companyId: string;
    barcodes: string[];
    excludeProductId?: string;
    excludeBarcodeUnitId?: string;
  }): Promise<void> {
    const uniqueBarcodes = Array.from(
      new Set(
        params.barcodes.map((b) => this.normalizeBarcode(b)).filter(Boolean),
      ),
    ) as string[];
    if (!uniqueBarcodes.length) return;

    const qb = this.productRepository
      .createQueryBuilder('p')
      .select(['p.id'])
      .where('p.company_id = :companyId', { companyId: params.companyId })
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('p.barcode = ANY(:barcodes)', { barcodes: uniqueBarcodes })
            .orWhere('p.alternate_barcodes && :barcodes', {
              barcodes: uniqueBarcodes,
            });
        }),
      );

    if (params.excludeProductId) {
      qb.andWhere('p.id != :excludeId', { excludeId: params.excludeProductId });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new BadRequestException(
        'Barcode already assigned to another product in this company',
      );
    }

    // Also enforce uniqueness against packaging/multi-unit barcodes.
    const unitQb = this.productBarcodeUnitRepository
      .createQueryBuilder('u')
      .select(['u.id'])
      .where('u.company_id = :companyId', { companyId: params.companyId })
      .andWhere('u.barcode_value = ANY(:barcodes)', { barcodes: uniqueBarcodes });

    if (params.excludeBarcodeUnitId) {
      unitQb.andWhere('u.id != :excludeUnitId', { excludeUnitId: params.excludeBarcodeUnitId });
    }

    const unitConflict = await unitQb.getOne();
    if (unitConflict) {
      throw new BadRequestException(
        'Barcode already assigned to another product in this company',
      );
    }
  }

  /**
   * Resolve a barcode to a single Product within the company scope.
   * - Does not touch stock/lots/expiry/FEFO.
   * - Ignores inactive (soft-deleted) products.
   */
  async findProductByBarcode(params: {
    companyId: string;
    barcode: string;
  }): Promise<Product> {
    const normalized = this.canonicalizeForScan(params.barcode);
    if (!normalized) {
      throw new BadRequestException('Barcode is required');
    }

    // If the scan looks like EAN-13, validate checksum early.
    if (
      this.looksLikeEan13(normalized) &&
      !this.isValidEan13Checksum(normalized)
    ) {
      throw new BadRequestException('Invalid EAN-13 checksum');
    }

    if (normalized.length > 100) {
      throw new BadRequestException('Barcode must be less than 100 characters');
    }

    const baseQuery = this.productRepository
      .createQueryBuilder('p')
      .where('p.company_id = :companyId', { companyId: params.companyId })
      .andWhere(
        new Brackets((sub) => {
          sub
            .where('p.barcode = :barcode', { barcode: normalized })
            .orWhere(':barcode = ANY(p.alternate_barcodes)', {
              barcode: normalized,
            });
        }),
      );

    const activeMatches = await baseQuery
      .clone()
      .andWhere('p.is_active = true')
      .getMany();

    if (activeMatches.length > 1) {
      throw new BadRequestException(
        'Duplicate barcode: multiple active products match',
      );
    }

    if (activeMatches.length === 1) {
      return activeMatches[0];
    }

    const inactiveMatches = await baseQuery
      .clone()
      .andWhere('p.is_active = false')
      .getMany();

    if (inactiveMatches.length > 0) {
      throw new BadRequestException('Barcode assigned to inactive product');
    }

    throw new NotFoundException('Barcode not found');
  }

  async resolveBarcodeWithUnit(params: {
    companyId: string;
    barcode: string;
  }): Promise<
    | {
        product: Product;
        barcode_value: string;
        unit_type: ProductBarcodeUnit['unit_type'];
        quantity_multiplier: number;
      }
    | null
  > {
    const normalized = this.canonicalizeForScan(params.barcode);
    if (!normalized) {
      throw new BadRequestException('Barcode is required');
    }

    // If the scan looks like EAN-13, validate checksum early.
    if (this.looksLikeEan13(normalized) && !this.isValidEan13Checksum(normalized)) {
      throw new BadRequestException('Invalid EAN-13 checksum');
    }

    if (normalized.length > 100) {
      throw new BadRequestException('Barcode must be less than 100 characters');
    }

    const unit = await this.productBarcodeUnitRepository.findOne({
      where: { company_id: params.companyId, barcode_value: normalized },
    });

    if (unit) {
      const product = await this.productRepository.findOne({
        where: { id: unit.product_id, company_id: params.companyId, is_active: true },
        relations: ['category', 'supplier'],
      });

      if (!product) {
        throw new NotFoundException('Barcode not found');
      }

      const multiplier = Number(unit.quantity_multiplier ?? 1);
      return {
        product,
        barcode_value: normalized,
        unit_type: unit.unit_type,
        quantity_multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
      };
    }

    const product = await this.findProductByBarcode({
      companyId: params.companyId,
      barcode: normalized,
    });

    return {
      product,
      barcode_value: normalized,
      unit_type: ProductBarcodeUnitType.PIECE,
      quantity_multiplier: 1,
    };
  }
}
