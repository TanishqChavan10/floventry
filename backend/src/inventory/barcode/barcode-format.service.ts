import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Company } from '../../company/company.entity';
import { BarcodeService } from './barcode.service';

@Injectable()
export class BarcodeFormatService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly barcodeService: BarcodeService,
  ) {}

  private buildCandidate(params: {
    prefix: string;
    padding: number;
    nextNumber: bigint;
    suffix: string;
  }): string {
    const prefix = (params.prefix ?? 'FLO-').trim();
    const suffix = (params.suffix ?? '').trim();

    const padding = Number.isFinite(params.padding)
      ? Math.max(0, Math.floor(params.padding))
      : 6;

    const padded = params.nextNumber.toString().padStart(padding, '0');
    return `${prefix}${padded}${suffix}`;
  }

  private parseNextNumber(value: unknown): bigint {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return BigInt(Math.max(1, Math.floor(value)));
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const parsed = BigInt(value);
        return parsed >= 1n ? parsed : 1n;
      } catch {
        return 1n;
      }
    }
    return 1n;
  }

  /**
   * Generate the next company barcode using a transaction + SELECT FOR UPDATE.
   * Concurrency-safe across simultaneous product creates / bulk operations.
   */
  async generateNextCompanyBarcode(companyId: string): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const barcode = await this.generateNextCompanyBarcodeWithManager(
        queryRunner.manager,
        companyId,
      );
      await queryRunner.commitTransaction();
      return barcode;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Same generator, but uses an existing transaction/manager.
   * Useful for imports/bulk flows that already run in a transaction.
   */
  async generateNextCompanyBarcodeWithManager(
    manager: EntityManager,
    companyId: string,
    options?: {
      reservedBarcodes?: Set<string>;
    },
  ): Promise<string> {
    const company = await manager.findOne(Company, {
      where: { id: companyId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const prefix = company.barcode_prefix ?? 'FLO-';
    const suffix = company.barcode_suffix ?? '';
    const padding =
      typeof company.barcode_padding === 'number' &&
      Number.isFinite(company.barcode_padding)
        ? company.barcode_padding
        : 6;

    let nextNumber = this.parseNextNumber(company.barcode_next_number);

    const reserved = options?.reservedBarcodes;
    const normalizeReservedKey = (value: string) => this.barcodeService.normalizeBarcode(value) ?? '';

    // Retry loop to handle collisions (e.g. format change mid-way, admin sets next too low).
    for (let attempt = 0; attempt < 5000; attempt++) {
      const candidate = this.buildCandidate({
        prefix,
        padding,
        nextNumber,
        suffix,
      });

      try {
        const normalized = await this.barcodeService.normalizeAndValidateForCompany({
          companyId,
          barcode: candidate,
          alternateBarcodes: null,
        });

        if (normalized.barcode) {
          const key = reserved ? normalizeReservedKey(normalized.barcode) : '';
          if (reserved && key && reserved.has(key)) {
            // Collision within current batch/transaction; try next number.
            nextNumber += 1n;
            continue;
          }

          company.barcode_next_number = (nextNumber + 1n).toString();
          await manager.save(Company, company);
          if (reserved && key) reserved.add(key);
          return normalized.barcode;
        }
      } catch {
        // Collision or invalid barcode: bump and try again.
      }

      nextNumber += 1n;
    }

    throw new BadRequestException('Failed to auto-generate a unique barcode');
  }
}
