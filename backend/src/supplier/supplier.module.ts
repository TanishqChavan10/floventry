import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierService } from './supplier.service';
import { SupplierResolver } from './supplier.resolver';
import { Supplier } from './supplier.entity';
import { AuthModule } from '../auth/auth.module'; // Needed for Guards if they rely on AuthModule providers

@Module({
  imports: [TypeOrmModule.forFeature([Supplier]), AuthModule],
  providers: [SupplierService, SupplierResolver],
  exports: [SupplierService],
})
export class SupplierModule {}
