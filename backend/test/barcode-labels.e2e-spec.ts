import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ClerkAuthGuard } from './../src/auth/guards/clerk-auth.guard';
import { BarcodeLabelService } from './../src/inventory/barcode-label.service';

describe('Barcode labels (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ClerkAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { activeCompanyId: 'company-1' };
          return true;
        },
      })
      .overrideProvider(BarcodeLabelService)
      .useValue({
        generateLabelsPdf: async () => Buffer.from('%PDF-FAKE', 'utf8'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('POST /api/barcode-labels returns a PDF', async () => {
    await request(app.getHttpServer())
      .post('/api/barcode-labels')
      .send({ productIds: ['11111111-1111-1111-1111-111111111111'] })
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
  });
});
