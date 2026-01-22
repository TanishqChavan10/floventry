import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class BarcodeService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    normalizeBarcode(raw?: string | null): string | null {
        if (raw === undefined || raw === null) return null;
        const trimmed = raw.trim();
        if (!trimmed) return null;
        return trimmed;
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
    }): Promise<{ barcode: string | null; alternate_barcodes: string[] | null }> {
        const barcode = this.normalizeBarcode(params.barcode);
        const alternate_barcodes = this.normalizeBarcodeList(params.alternateBarcodes);

        if (barcode && alternate_barcodes?.includes(barcode)) {
            throw new BadRequestException('Primary barcode cannot also appear in alternate barcodes');
        }

        const allBarcodes = [barcode, ...(alternate_barcodes ?? [])].filter(
            (b): b is string => typeof b === 'string' && b.length > 0,
        );

        if (allBarcodes.length) {
            await this.assertCompanyBarcodeUniqueness({
                companyId: params.companyId,
                barcodes: allBarcodes,
                excludeProductId: params.excludeProductId,
            });
        }

        return { barcode, alternate_barcodes };
    }

    async assertCompanyBarcodeUniqueness(params: {
        companyId: string;
        barcodes: string[];
        excludeProductId?: string;
    }): Promise<void> {
        const uniqueBarcodes = Array.from(new Set(params.barcodes.map((b) => this.normalizeBarcode(b)).filter(Boolean))) as string[];
        if (!uniqueBarcodes.length) return;

        const qb = this.productRepository
            .createQueryBuilder('p')
            .select(['p.id'])
            .where('p.company_id = :companyId', { companyId: params.companyId })
            .andWhere(
                new Brackets((sub) => {
                    sub.where('p.barcode = ANY(:barcodes)', { barcodes: uniqueBarcodes })
                        .orWhere('p.alternate_barcodes && :barcodes', { barcodes: uniqueBarcodes });
                }),
            );

        if (params.excludeProductId) {
            qb.andWhere('p.id != :excludeId', { excludeId: params.excludeProductId });
        }

        const conflict = await qb.getOne();
        if (conflict) {
            throw new BadRequestException('Barcode already assigned to another product in this company');
        }
    }

    /**
     * Resolve a barcode to a single Product within the company scope.
     * - Does not touch stock/lots/expiry/FEFO.
     * - Ignores inactive (soft-deleted) products.
     */
    async findProductByBarcode(params: { companyId: string; barcode: string }): Promise<Product> {
        const normalized = this.normalizeBarcode(params.barcode);
        if (!normalized) {
            throw new BadRequestException('Barcode is required');
        }

        const baseQuery = this.productRepository
            .createQueryBuilder('p')
            .where('p.company_id = :companyId', { companyId: params.companyId })
            .andWhere(
                new Brackets((sub) => {
                    sub.where('p.barcode = :barcode', { barcode: normalized }).orWhere(':barcode = ANY(p.alternate_barcodes)', {
                        barcode: normalized,
                    });
                }),
            );

        const activeMatches = await baseQuery
            .clone()
            .andWhere('p.is_active = true')
            .getMany();

        if (activeMatches.length > 1) {
            throw new BadRequestException('Duplicate barcode: multiple active products match');
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
}
