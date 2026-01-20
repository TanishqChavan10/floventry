import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import bwipjs from 'bwip-js';
import { BarcodeLabelService } from './barcode-label.service';
import { Product } from './entities/product.entity';

jest.mock('bwip-js', () => ({
  __esModule: true,
  default: {
    toBuffer: jest.fn(),
  },
}));

const ONE_BY_ONE_PNG = Buffer.from(
  // 1x1 transparent PNG
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6W2kS0AAAAASUVORK5CYII=',
  'base64',
);

function createProductRepoMock(products: Array<Partial<Product>>) {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(products),
  };

  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    __qb: qb,
  };
}

describe('BarcodeLabelService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (bwipjs as any).toBuffer.mockResolvedValue(ONE_BY_ONE_PNG);
  });

  it('generates a PDF for a valid product barcode', async () => {
    const repoMock = createProductRepoMock([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Test Product',
        sku: 'SKU-1',
        barcode: 'ABC123',
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        BarcodeLabelService,
        {
          provide: getRepositoryToken(Product),
          useValue: repoMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(BarcodeLabelService);

    const pdf = await service.generateLabelsPdf({
      companyId: 'company-1',
      productIds: ['11111111-1111-1111-1111-111111111111'],
    });

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.slice(0, 5).toString('utf8')).toBe('%PDF-');
    expect((bwipjs as any).toBuffer).toHaveBeenCalled();
  });

  it('rejects products without barcode', async () => {
    const repoMock = createProductRepoMock([
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'No Barcode',
        sku: 'SKU-2',
        barcode: null,
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        BarcodeLabelService,
        {
          provide: getRepositoryToken(Product),
          useValue: repoMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(BarcodeLabelService);

    await expect(
      service.generateLabelsPdf({
        companyId: 'company-1',
        productIds: ['22222222-2222-2222-2222-222222222222'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect((bwipjs as any).toBuffer).not.toHaveBeenCalled();
  });

  it('rejects when one or more products are not found', async () => {
    const repoMock = createProductRepoMock([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        BarcodeLabelService,
        {
          provide: getRepositoryToken(Product),
          useValue: repoMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(BarcodeLabelService);

    await expect(
      service.generateLabelsPdf({
        companyId: 'company-1',
        productIds: ['33333333-3333-3333-3333-333333333333'],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses EAN-13 when barcode is 13 digits', async () => {
    const repoMock = createProductRepoMock([
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'EAN',
        sku: 'EAN-1',
        barcode: '1234567890123',
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        BarcodeLabelService,
        {
          provide: getRepositoryToken(Product),
          useValue: repoMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(BarcodeLabelService);

    await service.generateLabelsPdf({
      companyId: 'company-1',
      productIds: ['44444444-4444-4444-4444-444444444444'],
    });

    expect((bwipjs as any).toBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ bcid: 'ean13', text: '1234567890123' }),
    );
  });
});
