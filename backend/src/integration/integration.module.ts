import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { Integration } from './entities/integration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Integration])],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule { }
