import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './role.service';
import { RoleResolver } from './role.resolver';
import { Role } from './role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RoleService, RoleResolver],
  exports: [RoleService],
})
export class RoleModule {}
