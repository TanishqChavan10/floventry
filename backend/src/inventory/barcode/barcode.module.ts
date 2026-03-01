import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { Company } from '../../company/company.entity';
import { Product } from '../entities/product.entity';
import { BarcodeHistory } from './entities/barcode-history.entity';
import { ProductBarcodeUnit } from './entities/product-barcode-unit.entity';
import { BarcodeService } from './barcode.service';
import { BarcodeFormatService } from './barcode-format.service';
import { BarcodeLabelService } from './barcode-label.service';
import { BarcodeThermalLabelService } from './barcode-thermal-label.service';
import { BarcodeLabelResolver } from './barcode-label.resolver';
import { BarcodeLabelController } from './barcode-label.controller';
import { ThermalLabelController } from './thermal-label.controller';
import { BarcodesController } from './barcodes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductBarcodeUnit, BarcodeHistory, Company]),
    AuthModule,
  ],
  controllers: [BarcodeLabelController, ThermalLabelController, BarcodesController],
  providers: [
    BarcodeService,
    BarcodeFormatService,
    BarcodeLabelService,
    BarcodeThermalLabelService,
    BarcodeLabelResolver,
  ],
  exports: [BarcodeService, BarcodeFormatService, BarcodeLabelService, BarcodeThermalLabelService],
})
export class BarcodeModule {}
